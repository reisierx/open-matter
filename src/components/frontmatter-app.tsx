import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  citedFacts,
  contentSha256,
  entityLabel,
  entityName,
  estimateTokens,
  parseManifest,
  readManifest,
  stringifyManifest,
  writeManifest,
  type Manifest,
  type ReadResult,
} from "open-matter";
import { answerFromCard, generateExam, generateManifest } from "@/lib/server/generate";
import { recordEnrichment } from "@/lib/server/stats";
import { extractPdfText } from "@/lib/pdf/extract-client";
import {
  answerMatchesGold,
  scoreEval,
  structuralChecks,
  verifyExamItem,
  type EvalResult,
  type ExamItem,
  type QuestionResult,
} from "@/lib/evals";
import { ASSUMPTIONS, documentVerdict, verdictPrimary } from "@/lib/savings";

const MAX_BYTES = 8 * 1024 * 1024;

type Phase =
  | "idle"
  | "reading"
  | "writing"
  | "examining"
  | "evaluating"
  | "review"
  | "has_card"
  | "ask"
  | "racing"
  | "verdict"
  | "binding"
  | "done"
  | "error";

type Lane = {
  tokens: number;
  ms: number;
  label: string;
  answer: string;
  done: boolean;
};

type FirstRead = { tokens: number; ms: number; pages: number };

function fallbackQuestions(manifest: Manifest | null): string[] {
  const sections = Object.keys(manifest?.key_sections ?? {});
  const entities = (manifest?.entities ?? []).map(entityName).filter(Boolean).slice(0, 2);
  const qs: string[] = [];
  if (entities[0]) qs.push(`Who is ${entities[0]} in this document, and on which page?`);
  if (citedFacts(manifest ?? { spec: "open-matter/0.1", title: "" }).length) {
    qs.push("What money changes hands, how much, and on which page?");
  }
  if (sections[0]) qs.push(`What does the “${sections[0].replaceAll("_", " ")}” section say, and on which page?`);
  while (qs.length < 3) qs.push("What is this document, and who are the parties?");
  return qs.slice(0, 3);
}

const STOP = new Set([
  "what", "which", "where", "when", "does", "did", "the", "this", "that", "from",
  "with", "have", "been", "were", "their", "about", "into", "than", "then", "your",
  "they", "them", "and", "for", "are", "was", "how", "who", "its", "not",
]);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9%]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function stem(w: string): string {
  const s = w.toLowerCase();
  if (s.endsWith("ies") && s.length > 5) return `${s.slice(0, -3)}y`;
  if (s.endsWith("ing") && s.length > 6) return s.slice(0, -3);
  if (s.endsWith("es") && s.length > 4) return s.slice(0, -2);
  if (s.endsWith("s") && s.length > 3 && !s.endsWith("ss")) return s.slice(0, -1);
  return s;
}

/** Trust the card's section names. Cover pages repeat keywords and win lexical search. */
function pickPages(
  question: string,
  manifest: Manifest | null,
  perPage: string[],
  forcePages?: number[],
): { pages: number[]; section: string | null; text: string } {
  const pack = (pages: number[], section: string | null) => ({
    pages,
    section,
    text: pages.map((p) => `--- page ${p} ---\n${perPage[p - 1] || ""}`).join("\n\n"),
  });

  if (forcePages?.length) {
    return pack([...new Set(forcePages.filter((p) => p > 0))], null);
  }

  const q = question.toLowerCase();
  const qStems = new Set(words(question).map(stem));
  const sections = Object.entries(manifest?.key_sections ?? {});

  let best: { name: string; page: number; score: number } | null = null;
  for (const [name, rawPage] of sections) {
    const page = Number(rawPage) || 0;
    if (!page) continue;
    let score = 0;
    for (const part of name.split("_").filter((p) => p.length > 2)) {
      if (qStems.has(stem(part)) || q.includes(part)) score += 4;
    }
    if (/\b(percent|percentage|%|how many|how much|allocation|founder)\b/.test(q)) {
      if (/alloc|founder|supply|cap/.test(name)) score += 10;
    }
    if (!best || score > best.score) best = { name, page, score };
  }

  if (best && best.score >= 4) {
    const pages = [best.page];
    if (perPage[best.page]) pages.push(best.page + 1);
    return pack(pages, best.name);
  }

  const scored = perPage.map((body, i) => {
    const page = i + 1;
    const hay = body.toLowerCase();
    let score = 0;
    for (const w of qStems) {
      if (hay.includes(w)) score += 1;
    }
    if (page === 1) score *= 0.3;
    return { page, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, 2);
  const pages = top.length ? top.map((s) => s.page) : [sections[0] ? Number(sections[0][1]) || 1 : 1];
  return pack(pages, null);
}

function looksLikeMiss(answer: string): boolean {
  return /do not contain|does not contain|doesn't contain|not contain the answer|cannot find|could not find|no (such )?(figure|percentage|amount)/i.test(
    answer,
  );
}

function hintFromAnswer(
  answer: string,
  manifest: Manifest | null,
): { section: string; page: number } | null {
  const named = answer.match(/\b([a-z][a-z0-9_]{2,})\s*:\s*(\d{1,4})\b/i);
  if (named) return { section: named[1], page: Number(named[2]) };
  for (const [name, p] of Object.entries(manifest?.key_sections ?? {})) {
    const hay = answer.toLowerCase();
    if (hay.includes(name) || hay.includes(name.replaceAll("_", " "))) {
      return { section: name, page: Number(p) || 0 };
    }
  }
  return null;
}

export function FrontmatterApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [filename, setFilename] = useState("");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState(0);
  const [text, setText] = useState("");
  const [perPage, setPerPage] = useState<string[]>([]);
  const [existing, setExisting] = useState<ReadResult | null>(null);
  const [yaml, setYaml] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showYaml, setShowYaml] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [plain, setPlain] = useState<Lane | null>(null);
  const [carded, setCarded] = useState<Lane | null>(null);
  const [missed, setMissed] = useState(false);
  const [hint, setHint] = useState<{ section: string; page: number } | null>(null);
  const [firstRead, setFirstRead] = useState<FirstRead | null>(null);
  const [writeElapsed, setWriteElapsed] = useState(0);
  const [exam, setExam] = useState<ExamItem[]>([]);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const examRef = useRef<ExamItem[]>([]);

  useEffect(() => {
    if (phase !== "writing" && phase !== "examining" && phase !== "evaluating") return;
    const t0 = performance.now();
    const id = window.setInterval(() => setWriteElapsed(performance.now() - t0), 100);
    return () => window.clearInterval(id);
  }, [phase]);

  const validation = useMemo(() => (yaml.trim() ? parseManifest(yaml) : null), [yaml]);
  const manifest = validation?.ok ? validation.value : existing?.manifest ?? null;

  const verdict = useMemo(() => {
    const full = estimateTokens(text);
    const card = estimateTokens(yaml || " ");
    const fullSec = Math.max(0.4, pages * ASSUMPTIONS.secondsPerPage);
    return documentVerdict(full, card, fullSec, ASSUMPTIONS.secondsPerCard);
  }, [text, yaml, pages]);

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    setShowYaml(false);
    setPlain(null);
    setCarded(null);
    setQuestion("");
    setMissed(false);
    setHint(null);
    setFirstRead(null);
    setWriteElapsed(0);
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPhase("error");
      setError("That is not a PDF. Choose a file that ends in .pdf.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhase("error");
      setError("This file is larger than 8 MB. Split it, or use a smaller copy.");
      return;
    }
    setPhase("reading");
    setStep(1);
    setFilename(file.name);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const extracted = await extractPdfText(buf);
      const card = await readManifest(buf, { extractedText: extracted.text });
      setPdfBytes(buf);
      setPages(extracted.pages);
      setText(extracted.text);
      setPerPage(extracted.perPage);
      setExisting(card);
      if (card.yaml && card.manifest && !card.stale) {
        setYaml(card.yaml);
        setQuestions(fallbackQuestions(card.manifest));
        setFirstRead({ tokens: estimateTokens(extracted.text), ms: 0, pages: extracted.pages });
        await sitExam(card.yaml, extracted.perPage, extracted.text, extracted.pages);
        return;
      }
      if (card.yaml) setYaml(card.yaml);
      else setYaml("");
      await draftCard({
        extractedText: extracted.text,
        extractedPages: extracted.pages,
        name: file.name,
        existingYaml: card.yaml ?? undefined,
        perPage: extracted.perPage,
      });
    } catch {
      setPhase("error");
      setError("The file could not be opened as a PDF. Try another copy.");
    }
  }, []);

  async function draftCard(opts?: {
    extractedText?: string;
    extractedPages?: number;
    name?: string;
    existingYaml?: string;
    focus?: string;
    perPage?: string[];
  }) {
    const useText = opts?.extractedText ?? text;
    const usePages = opts?.extractedPages ?? pages;
    const useName = opts?.name ?? filename;
    const usePerPage = opts?.perPage ?? perPage;
    const useExisting = opts?.existingYaml ?? existing?.yaml ?? yaml ?? undefined;
    const writeTokens = estimateTokens(useText);
    const isExpand = Boolean(opts?.focus);
    if (!isExpand) {
      setFirstRead({ tokens: writeTokens, ms: 0, pages: usePages });
      setWriteElapsed(0);
    }
    setPhase("writing");
    setError(null);
    const started = performance.now();
    try {
      const res = await generateManifest({
        data: {
          text: useText.slice(0, 60_000),
          pages: usePages,
          filename: useName,
          existingYaml: useExisting,
          focus: opts?.focus,
        },
      });
      if (!res.ok) {
        if (!yaml.trim()) starterCard(useName, usePages, useText);
        setQuestions(fallbackQuestions(null));
        setError(res.error);
        setPhase("review");
        setStep(2);
        return;
      }
      const hash = await contentSha256(useText);
      const parsed = parseManifest(res.yaml);
      if (parsed.ok) {
        setYaml(stringifyManifest({ ...parsed.value, content_sha256: hash, pages: usePages }));
        setQuestions(res.questions?.length ? res.questions : fallbackQuestions(parsed.value));
      } else {
        setYaml(res.yaml);
        setQuestions(res.questions ?? fallbackQuestions(null));
      }
      if (!isExpand) {
        setFirstRead({ tokens: writeTokens, ms: performance.now() - started, pages: usePages });
      }
      const yamlOut = parsed.ok
        ? stringifyManifest({ ...parsed.value, content_sha256: hash, pages: usePages })
        : res.yaml;
      await sitExam(yamlOut, usePerPage, useText, usePages);
      return;
    } catch {
      if (!yaml.trim()) starterCard(useName, usePages, useText);
      setQuestions(fallbackQuestions(null));
      setError("The model could not write the card. Edit it yourself, or try again.");
      setPhase("review");
      setStep(2);
    }
  }

  function starterCard(name = filename, pageCount = pages, body = text) {
    const stub: Manifest = {
      spec: "open-matter/0.1",
      title: name.replace(/\.pdf$/i, "") || "Untitled document",
      pages: pageCount,
      summary: "",
      extraction: { scanned: body.length < 40 },
    };
    setYaml(stringifyManifest(stub));
  }

  function taggedPages(list: string[]): string {
    return list.map((t, i) => `--- page ${i + 1} ---\n${t}`).join("\n\n").slice(0, 60_000);
  }

  async function ensureExam(list: string[], pageCount: number): Promise<ExamItem[]> {
    if (examRef.current.length) return examRef.current;
    setPhase("examining");
    try {
      const res = await generateExam({
        data: { pages: taggedPages(list), pageCount },
      });
      const raw = res.ok ? res.items : [];
      const verified = raw.filter((item) => verifyExamItem(item, list));
      examRef.current = verified;
      setExam(verified);
      return verified;
    } catch {
      examRef.current = [];
      setExam([]);
      return [];
    }
  }

  async function sitExam(yamlStr: string, list: string[], _body: string, pageCount: number) {
    const items = await ensureExam(list, pageCount);
    setPhase("evaluating");
    setStep(2);
    const parsed = parseManifest(yamlStr);
    const structural = parsed.ok
      ? structuralChecks(parsed.value, list)
      : [{ id: "yaml", ok: false, label: parsed.error }];
    const questionRows: QuestionResult[] = [];
    let tokens = estimateTokens(yamlStr || " ");
    const t0 = performance.now();
    for (const item of items.slice(0, 5)) {
      try {
        let hop = await answerFromCard({ data: { question: item.question, yaml: yamlStr } });
        if (hop.ok && hop.status === "need_page" && hop.needPage > 0) {
          const pageText = list[hop.needPage - 1] || "";
          tokens += estimateTokens(pageText);
          hop = await answerFromCard({
            data: { question: item.question, yaml: yamlStr, pageText, page: hop.needPage },
          });
        }
        const answer = hop.ok ? hop.answer : hop.error;
        const ok = Boolean(hop.ok && hop.status === "answered" && answerMatchesGold(answer, item.answer));
        questionRows.push({ question: item.question, gold: item.answer, page: item.page, answer, ok });
      } catch {
        questionRows.push({
          question: item.question,
          gold: item.answer,
          page: item.page,
          answer: "The question could not be asked.",
          ok: false,
        });
      }
    }
    setEvalResult(scoreEval(structural, questionRows, tokens, performance.now() - t0));
    setPhase("review");
    setStep(2);
  }

  function goAsk() {
    const parsed = parseManifest(yaml);
    if (!parsed.ok) {
      setError(parsed.error);
      setShowYaml(true);
      return;
    }
    setError(null);
    setPhase("ask");
    setStep(3);
    if (!questions.length) setQuestions(fallbackQuestions(parsed.value));
  }

  async function runRace(asked: string, forcePages?: number[]) {
    const q = asked.trim();
    if (!q) return;
    setQuestion(q);
    setPhase("racing");
    setStep(3);
    setError(null);
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setMissed(false);
    setHint(null);

    const prior = firstRead ?? {
      tokens: estimateTokens(text),
      ms: 0,
      pages,
    };
    const started = performance.now();
    const cardTokens = estimateTokens(yaml || " ");

    setPlain({
      tokens: prior.tokens,
      ms: prior.ms,
      label: prior.pages ? `${prior.pages} pages` : "First read",
      answer: "",
      done: true,
    });
    setCarded({ tokens: cardTokens, ms: 0, label: "Reading the card…", answer: "", done: false });

    try {
      const forced = forcePages?.[0];
      let hop = forced
        ? await answerFromCard({
            data: {
              question: q,
              yaml,
              pageText: perPage[(forced ?? 1) - 1] || "",
              page: forced,
            },
          })
        : await answerFromCard({
            data: { question: q, yaml },
          });

      if (!hop.ok) {
        setMissed(true);
        setCarded({
          tokens: cardTokens,
          ms: Math.round(performance.now() - started),
          label: "From the card",
          answer: hop.error,
          done: true,
        });
        setPhase("verdict");
        return;
      }

      let sent = cardTokens;
      let label = "From the card";
      if (!forced && hop.status === "need_page" && hop.needPage > 0) {
        const n = hop.needPage;
        const pageText = perPage[n - 1] || "";
        sent += estimateTokens(pageText);
        setCarded({
          tokens: sent,
          ms: Math.round(performance.now() - started),
          label: `Opening page ${n}…`,
          answer: "",
          done: false,
        });
        hop = await answerFromCard({
          data: { question: q, yaml, pageText, page: n },
        });
        label = `Card, then page ${n}`;
        if (!hop.ok) {
          setMissed(true);
          setCarded({
            tokens: sent,
            ms: Math.round(performance.now() - started),
            label,
            answer: hop.error,
            done: true,
          });
          setPhase("verdict");
          return;
        }
      }

      const miss = hop.status === "miss" || hop.status === "need_page";
      setMissed(miss);
      if (miss && (hop.needPage || hop.page)) {
        setHint({ section: "page", page: hop.needPage || hop.page });
      } else if (miss) {
        setHint(hintFromAnswer(hop.answer, manifest));
      }
      setCarded({
        tokens: sent,
        ms: Math.round(performance.now() - started),
        label: forced ? `Page ${forced}` : label,
        answer: hop.answer,
        done: true,
      });
    } catch {
      setCarded({
        tokens: cardTokens,
        ms: Math.round(performance.now() - started),
        label: "From the card",
        answer: "The question could not be asked. Try again.",
        done: true,
      });
      setMissed(true);
    }
    setPhase("verdict");
  }

  async function attachAndDownload() {
    if (!pdfBytes) return;
    const parsed = parseManifest(yaml);
    if (!parsed.ok) {
      setError(parsed.error);
      setShowYaml(true);
      setPhase("review");
      return;
    }
    setPhase("binding");
    setError(null);
    try {
      const hash = await contentSha256(text);
      const next: Manifest = { ...parsed.value, content_sha256: hash, pages };
      const yamlOut = stringifyManifest(next);
      setYaml(yamlOut);
      const out = await writeManifest(pdfBytes, yamlOut);
      const blob = new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = filename.replace(/\.pdf$/i, "").replace(/\.frontmatter$/i, "").replace(/\.fm$/i, "");
      const outName = `${base}.fm.pdf`;
      a.href = url;
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSavedName(outName);
      setPhase("done");
      setStep(3);
      const saved = Math.max(0, estimateTokens(text) - estimateTokens(yamlOut));
      void recordEnrichment({ data: { tokensSaved: saved } }).catch(() => undefined);
    } catch (err) {
      setPhase("verdict");
      setError(err instanceof Error ? err.message : "The card could not be attached. Try again.");
    }
  }

  function reset() {
    timers.current.forEach((id) => window.clearTimeout(id));
    setPhase("idle");
    setStep(1);
    setFilename("");
    setPdfBytes(null);
    setPages(0);
    setText("");
    setPerPage([]);
    setExisting(null);
    setYaml("");
    setQuestions([]);
    setQuestion("");
    setError(null);
    setShowYaml(false);
    setSavedName("");
    setPlain(null);
    setCarded(null);
    setMissed(false);
    setHint(null);
    setFirstRead(null);
    setWriteElapsed(0);
    setExam([]);
    setEvalResult(null);
    examRef.current = [];
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ol
        className="flex shrink-0 justify-center gap-4 border-b border-rule px-4 py-2 text-xs tracking-[0.16em] text-muted uppercase sm:gap-6"
        aria-label="Steps"
      >
        <li className={step === 1 ? "text-oxblood" : ""}>i · drop</li>
        <li className={step === 2 ? "text-oxblood" : ""}>ii · exam</li>
        <li className={step === 3 ? "text-oxblood" : ""}>iii · download</li>
      </ol>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-3 sm:px-6">
        <div className="flex max-h-full w-full max-w-xl flex-col overflow-hidden">
          {phase === "idle" || (phase === "error" && !pdfBytes) ? (
            <Idle
              dragging={dragging}
              setDragging={setDragging}
              error={error}
              onPick={() => inputRef.current?.click()}
              onFile={(f) => void loadFile(f)}
            />
          ) : null}

          {phase === "reading" ? (
            <Status title={`Reading${pages ? ` ${pages} pages` : ""}…`} body={filename} />
          ) : null}
          {phase === "writing" ? (
            <Status
              title="Reading the file to write the card…"
              body={`${firstRead?.pages || pages || "—"} pages · ${(firstRead?.tokens ?? 0).toLocaleString("en-GB")} tokens · ${(writeElapsed / 1000).toFixed(1)}s`}
            />
          ) : null}
          {phase === "examining" ? (
            <Status title="Writing the exam from the pages…" body="The card does not get to write the questions." />
          ) : null}
          {phase === "evaluating" ? (
            <Status
              title="Sitting the exam…"
              body={exam.length ? `${exam.length} questions from the document` : "Checking cites against the pages"}
            />
          ) : null}
          {phase === "binding" ? <Status title="Attaching the card…" body={filename} /> : null}

          {phase === "review" || phase === "has_card" ? (
            <Review
              phase={phase}
              filename={filename}
              pages={pages}
              stale={Boolean(existing?.stale)}
              manifest={manifest}
              yaml={yaml}
              showYaml={showYaml}
              setShowYaml={setShowYaml}
              setYaml={setYaml}
              validation={validation}
              error={error}
              firstRead={firstRead}
              evalResult={evalResult}
              onBack={reset}
              onRegenerate={() => {
                const misses = evalResult?.questions.filter((q) => !q.ok) ?? [];
                const struct = evalResult?.structural.filter((c) => !c.ok).map((c) => c.label) ?? [];
                const focus = [
                  ...misses.map(
                    (q) => `${q.question} — the pages say (p.${q.page}): ${q.gold}. Add a cited fact.`,
                  ),
                  ...struct,
                ].join("\n");
                void draftCard({ focus: focus || undefined });
              }}
              onContinue={goAsk}
              onDownload={() => void attachAndDownload()}
            />
          ) : null}

          {phase === "ask" ? (
            <Ask
              questions={questions}
              onAsk={(q) => void runRace(q)}
              onBack={() => {
                setPhase(existing?.manifest && !existing.stale ? "has_card" : "review");
                setStep(2);
              }}
            />
          ) : null}

          {phase === "racing" || phase === "verdict" ? (
            <RaceOnFile
              question={question}
              plain={plain}
              carded={carded}
              finished={phase === "verdict"}
              missed={missed}
              hint={hint}
              firstRead={firstRead}
              onDownload={() => void attachAndDownload()}
              onAsk={() => {
                setPhase("ask");
                setPlain(null);
                setCarded(null);
                setMissed(false);
              }}
              onRetryHint={
                hint?.page ? () => void runRace(question, [hint.page, hint.page + 1]) : undefined
              }
              onExpand={() => void draftCard({ existingYaml: yaml, focus: question })}
            />
          ) : null}

          {phase === "done" ? (
            <Done savedName={savedName} verdict={verdict} onAgain={reset} onVerify={() => inputRef.current?.click()} />
          ) : null}

          {phase === "error" && pdfBytes ? (
            <div className="space-y-4">
              <p className="text-sm text-warn" role="alert">
                {error}
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={reset} className="h-11 border border-rule px-5 text-sm">
                  Start over
                </button>
                <button
                  type="button"
                  onClick={() => void draftCard()}
                  className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void loadFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Idle({
  dragging,
  setDragging,
  error,
  onPick,
  onFile,
}: {
  dragging: boolean;
  setDragging: (v: boolean) => void;
  error: string | null;
  onPick: () => void;
  onFile: (f: File) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-4xl sm:text-5xl">Drop a PDF.</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        A frontier model writes a card. An exam written from the pages — not
        from the card — has to pass. Then you download the same file with the
        card inside.
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={`mt-6 border border-dashed px-4 py-10 text-center ${
          dragging ? "border-oxblood bg-paper-2" : "border-rule-strong bg-folio"
        }`}
      >
        <p className="text-sm text-muted">PDF, up to 8 MB.</p>
        <button
          type="button"
          onClick={onPick}
          className="mt-4 h-11 min-w-40 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep"
        >
          Choose a PDF
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-warn" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-faint">
        Your file and your question are read in your browser. A model sees the
        extracted text long enough to write the card and answer, then forgets
        both. Nothing is stored.
      </p>
    </div>
  );
}

function Status({ title, body }: { title: string; body: string }) {
  return (
    <div aria-live="polite">
      <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-muted">{body}</p>
      <div className="mt-6 h-1.5 overflow-hidden bg-paper-2">
        <div className="h-full w-2/5 animate-pulse bg-oxblood" />
      </div>
    </div>
  );
}

function Review({
  phase,
  filename,
  pages,
  stale,
  manifest,
  yaml,
  showYaml,
  setShowYaml,
  setYaml,
  validation,
  error,
  firstRead,
  evalResult,
  onBack,
  onRegenerate,
  onContinue,
  onDownload,
}: {
  phase: Phase;
  filename: string;
  pages: number;
  stale: boolean;
  manifest: Manifest | null;
  yaml: string;
  showYaml: boolean;
  setShowYaml: (v: boolean) => void;
  setYaml: (v: string) => void;
  validation: ReturnType<typeof parseManifest> | null;
  error: string | null;
  firstRead: FirstRead | null;
  evalResult: EvalResult | null;
  onBack: () => void;
  onRegenerate: () => void;
  onContinue: () => void;
  onDownload: () => void;
}) {
  const passed = evalResult?.passed ?? false;
  const qOk = evalResult?.questions.filter((q) => q.ok).length ?? 0;
  const qN = evalResult?.questions.length ?? 0;
  return (
    <div className="flex min-h-0 flex-col">
      <div className="shrink-0">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">{filename}</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">
          {evalResult ? (passed ? "The card passed." : "The card failed the exam.") : "Review the card."}
        </h1>
        {stale ? (
          <p className="mt-2 text-sm text-warn">The text has changed since this card was written. Replace it.</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-warn" role="alert">
            {error}
          </p>
        ) : null}
        {evalResult ? (
          <p className={`mt-2 font-display text-xl ${passed ? "text-oxblood" : "text-ink"}`}>
            {qN ? `${qOk}/${qN} questions` : "No grounded questions"}
            {evalResult.structural.length
              ? ` · ${evalResult.structural.filter((c) => c.ok).length}/${evalResult.structural.length} cites`
              : ""}
            {` · ${evalResult.tokens.toLocaleString("en-GB")} tokens`}
            {evalResult.ms > 0 ? ` · ${(evalResult.ms / 1000).toFixed(1)}s` : ""}
          </p>
        ) : null}
        {firstRead && firstRead.tokens > 0 ? (
          <p className="mt-1 text-sm text-ink-soft">
            First read: {firstRead.tokens.toLocaleString("en-GB")} tokens
            {firstRead.ms > 0 ? ` · ${(firstRead.ms / 1000).toFixed(1)}s` : ""}
            {firstRead.pages ? ` · ${firstRead.pages} pages` : ""}. The exam is written from the pages, not the card.
          </p>
        ) : null}
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
        {showYaml ? (
          <div className="flex h-full min-h-0 flex-col">
            <textarea
              value={yaml}
              onChange={(e) => setYaml(e.target.value)}
              spellCheck={false}
              aria-label="Raw card YAML"
              className="min-h-36 w-full flex-1 resize-none overflow-y-auto border border-rule bg-ink p-3 text-xs leading-relaxed text-paper"
            />
            {validation && !validation.ok ? (
              <p className="mt-2 text-xs text-warn">{validation.error}</p>
            ) : (
              <p className="mt-2 text-xs text-ok">Valid YAML.</p>
            )}
          </div>
        ) : (
          <div className="max-h-56 space-y-3 overflow-y-auto sm:max-h-72">
            {evalResult ? <Scorecard result={evalResult} /> : null}
            <SummaryCard manifest={manifest} pages={pages} />
          </div>
        )}
      </div>
      <div className="mt-3 shrink-0 space-y-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={showYaml} onChange={(e) => setShowYaml(e.target.checked)} />
          Edit the raw card (YAML)
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {passed ? (
            <button
              type="button"
              onClick={onDownload}
              disabled={!validation?.ok}
              className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep disabled:opacity-50"
            >
              Attach the card and download
            </button>
          ) : (
            <button
              type="button"
              onClick={onRegenerate}
              className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep"
            >
              Rebuild the card
            </button>
          )}
          {passed ? (
            <button type="button" onClick={onRegenerate} className="h-11 border border-rule px-5 text-sm">
              Rebuild
            </button>
          ) : (
            <button
              type="button"
              onClick={onDownload}
              disabled={!validation?.ok}
              className="h-11 border border-rule px-5 text-sm disabled:opacity-50"
            >
              Download anyway
            </button>
          )}
          <button type="button" onClick={onContinue} className="h-11 border border-rule px-5 text-sm">
            Ask one yourself
          </button>
          <button type="button" onClick={onBack} className="h-11 px-3 text-sm text-muted">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

function Scorecard({ result }: { result: EvalResult }) {
  return (
    <div className="border border-rule bg-folio p-4">
      <p className="text-xs tracking-[0.16em] text-oxblood uppercase">Exam from the pages</p>
      <ul className="mt-2 space-y-1 text-sm">
        {result.structural.map((c) => (
          <li key={c.id} className={c.ok ? "text-ink-soft" : "text-warn"}>
            {c.ok ? "Pass" : "Fail"} · {c.label}
          </li>
        ))}
        {result.questions.map((q) => (
          <li key={q.question} className={q.ok ? "text-ink-soft" : "text-warn"}>
            {q.ok ? "Pass" : "Fail"} · {q.question}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryCard({ manifest, pages }: { manifest: Manifest | null; pages: number }) {
  if (!manifest) {
    return <p className="text-sm text-muted">No card yet. Open the YAML editor or regenerate.</p>;
  }
  const sections = Object.entries(manifest.key_sections ?? {});
  return (
    <div className="max-h-56 space-y-2 overflow-y-auto border border-rule bg-folio p-4 sm:max-h-72">
      <p className="font-display text-2xl">{manifest.title}</p>
      <p className="text-sm text-muted">
        {[manifest.doc_type, manifest.language, `${manifest.pages ?? pages} pages`].filter(Boolean).join(" · ")}
      </p>
      {manifest.summary ? <p className="text-sm text-ink-soft">{manifest.summary}</p> : null}
      {sections.length ? (
        <ul className="flex flex-wrap gap-2">
          {sections.map(([name, page]) => (
            <li
              key={name}
              className="border border-rule bg-paper px-2 py-1 font-mono text-[0.7rem] text-ink-soft"
            >
              {name.replaceAll("_", " ")} · p.{page}
            </li>
          ))}
        </ul>
      ) : null}
      {manifest.entities?.length ? (
        <p className="text-xs text-muted">
          {manifest.entities.map(entityLabel).filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {citedFacts(manifest).length ? (
        <ul className="space-y-1 text-sm text-ink-soft">
          {citedFacts(manifest).slice(0, 8).map((f) => (
            <li key={`${f.page}-${f.fact}`}>
              {f.fact}
              <span className="text-muted"> · p.{f.page || "?"}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Ask({
  questions,
  onAsk,
  onBack,
}: {
  questions: string[];
  onAsk: (q: string) => void;
  onBack: () => void;
}) {
  const [custom, setCustom] = useState("");
  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Ask it something only this file knows.</h1>
      <p className="mt-2 text-sm text-ink-soft">
        The card names the section. We open that page and answer. Optional — you
        can skip this and just download.
      </p>
      <ul className="mt-4 space-y-2">
        {questions.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onAsk(q)}
              className="w-full border border-rule bg-folio px-3 py-3 text-left text-sm text-ink hover:border-ink"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (custom.trim()) onAsk(custom.trim());
        }}
      >
        <label className="sr-only" htmlFor="own-q">
          Your question
        </label>
        <input
          id="own-q"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Or type a question"
          className="h-11 min-w-0 flex-1 border border-rule bg-folio px-3 font-serif text-sm"
        />
        <button type="submit" className="h-11 border border-oxblood bg-oxblood px-4 text-sm text-oxblood-ink">
          Ask
        </button>
      </form>
      <button type="button" onClick={onBack} className="mt-3 text-sm text-muted">
        Back
      </button>
    </div>
  );
}

function RaceOnFile({
  question,
  plain,
  carded,
  finished,
  missed,
  hint,
  firstRead,
  onDownload,
  onAsk,
  onRetryHint,
  onExpand,
}: {
  question: string;
  plain: Lane | null;
  carded: Lane | null;
  finished: boolean;
  missed: boolean;
  hint: { section: string; page: number } | null;
  firstRead: FirstRead | null;
  onDownload: () => void;
  onAsk: () => void;
  onRetryHint?: () => void;
  onExpand: () => void;
}) {
  const priorTokens = firstRead?.tokens || plain?.tokens || 0;
  const priorMs = firstRead?.ms || plain?.ms || 0;
  const nowTokens = carded?.tokens || 0;
  const nowMs = carded?.ms || 0;
  const tokenX = nowTokens > 0 ? priorTokens / nowTokens : 0;
  const timeX = nowMs > 0 && priorMs > 0 ? priorMs / nowMs : 0;

  return (
    <div className="min-h-0 overflow-y-auto">
      <p className="font-serif text-sm italic">“{question}”</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <LaneView kicker="i" title="First read" lane={plain} />
        <LaneView kicker="ii" title="This question" lane={carded} accent />
      </div>
      {finished ? (
        <div className="mt-4">
          {missed ? (
            <>
              <p className="font-display text-xl">The card did not land on the answer.</p>
              {hint?.page ? (
                <p className="mt-2 text-sm text-ink-soft">
                  It pointed at{" "}
                  <span className="font-medium text-ink">{hint.section.replaceAll("_", " ")}</span> on
                  page {hint.page}. Open that page, or expand the card so the next
                  read finds it.
                </p>
              ) : (
                <p className="mt-2 text-sm text-ink-soft">
                  Expand the card with this question, or ask a different one.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-display text-xl text-oxblood">
                {nowTokens.toLocaleString("en-GB")} tokens · {(nowMs / 1000).toFixed(1)}s
                {tokenX >= 1.5
                  ? ` · ${tokenX >= 10 ? Math.round(tokenX) : tokenX.toFixed(1)}× fewer tokens`
                  : ""}
                {timeX >= 1.3 ? ` · ${timeX.toFixed(1)}× faster` : ""}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                First read was {priorTokens.toLocaleString("en-GB")} tokens
                {priorMs > 0 ? ` in ${(priorMs / 1000).toFixed(1)}s` : ""}. The next
                question skips that.
              </p>
            </>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {missed && onRetryHint ? (
              <button
                type="button"
                onClick={onRetryHint}
                className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink"
              >
                Open page {hint?.page} and try again
              </button>
            ) : null}
            {missed ? (
              <button type="button" onClick={onExpand} className="h-11 border border-rule px-5 text-sm">
                Expand the card
              </button>
            ) : (
              <button
                type="button"
                onClick={onDownload}
                className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink"
              >
                Attach the card and download
              </button>
            )}
            <button type="button" onClick={onAsk} className="h-11 border border-rule px-5 text-sm">
              Ask another
            </button>
            {missed ? (
              <button type="button" onClick={onDownload} className="h-11 px-3 text-sm text-muted">
                Download anyway
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LaneView({
  kicker,
  title,
  lane,
  accent,
  note,
}: {
  kicker: string;
  title: string;
  lane: Lane | null;
  accent?: boolean;
  note?: string;
}) {
  return (
    <div className={`border border-rule p-3 ${accent ? "bg-paper-2/40" : "bg-folio"}`}>
      <p className="text-xs tracking-[0.14em] text-muted uppercase">{kicker}</p>
      <h3 className="font-display text-lg">{title}</h3>
      {lane ? (
        <>
          <p className="mt-2 text-xs text-ink-soft">{lane.label}</p>
          <p className="font-display text-2xl tabular-nums">{lane.tokens.toLocaleString("en-GB")}</p>
          {lane.ms > 0 ? <p className="text-xs text-muted">{(lane.ms / 1000).toFixed(1)}s</p> : null}
          {lane.done && lane.answer ? <p className="mt-2 text-sm text-ink-soft">{lane.answer}</p> : null}
          {note ? <p className="mt-2 text-xs text-faint">{note}</p> : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">Waiting…</p>
      )}
    </div>
  );
}

function Done({
  savedName,
  verdict,
  onAgain,
  onVerify,
}: {
  savedName: string;
  verdict: ReturnType<typeof documentVerdict>;
  onAgain: () => void;
  onVerify: () => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Done.</h1>
      <p className="mt-3 text-ink-soft">
        <span className="font-medium text-ink">{savedName}</span> saved. Same file,
        plus a 1 KB card inside. Nothing visible changed.
      </p>
      <p className="mt-4 font-display text-xl text-oxblood">{verdictPrimary(verdict)}</p>
      {verdict.moneyLine ? <p className="mt-1 text-sm text-ink-soft">{verdict.moneyLine}</p> : null}
      <p className="mt-2 text-xs text-faint">
        Mac Preview will not list the attachment. Acrobat will. So will this app,
        if you drop the file back in.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onVerify}
          className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink"
        >
          Verify it
        </button>
        <button type="button" onClick={onAgain} className="h-11 border border-rule px-5 text-sm">
          Do another one
        </button>
        <Link to="/spec" className="inline-flex h-11 items-center px-3 text-sm">
          Read the spec
        </Link>
      </div>
    </div>
  );
}
