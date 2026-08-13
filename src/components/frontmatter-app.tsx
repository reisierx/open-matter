import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  contentSha256,
  estimateTokens,
  parseManifest,
  readManifest,
  stringifyManifest,
  writeManifest,
  type Manifest,
  type ReadResult,
} from "open-matter";
import { answerFromCard, generateManifest } from "@/lib/server/generate";
import { recordEnrichment } from "@/lib/server/stats";
import { extractPdfText } from "@/lib/pdf/extract-client";
import {
  ASSUMPTIONS,
  documentVerdict,
  formatMultiple,
  verdictPrimary,
} from "@/lib/savings";

const MAX_BYTES = 8 * 1024 * 1024;

type Phase =
  | "idle"
  | "reading"
  | "writing"
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

function fallbackQuestions(manifest: Manifest | null): string[] {
  const sections = Object.keys(manifest?.key_sections ?? {});
  const entities = (manifest?.entities ?? []).slice(0, 2);
  const qs: string[] = [];
  if (sections[0]) qs.push(`What does the “${sections[0].replaceAll("_", " ")}” section say, and on which page?`);
  if (entities[0]) qs.push(`Who is ${entities[0]} in this document?`);
  if (sections[1]) qs.push(`Where is “${sections[1].replaceAll("_", " ")}” and what does it cover?`);
  while (qs.length < 3) qs.push("What is this document, and who are the parties?");
  return qs.slice(0, 3);
}

function pickPage(question: string, manifest: Manifest | null, perPage: string[]): { page: number; text: string } {
  const sections = Object.entries(manifest?.key_sections ?? {});
  const q = question.toLowerCase();
  let page = 0;
  for (const [name, p] of sections) {
    if (q.includes(name.replaceAll("_", " ")) || q.includes(name)) {
      page = Number(p) || 0;
      break;
    }
  }
  if (!page && sections[0]) page = Number(sections[0][1]) || 0;
  if (!page) page = 1;
  const text = perPage[page - 1] || perPage.slice(0, 2).join("\n\n") || "";
  return { page, text };
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
        setPhase("has_card");
        setStep(2);
        return;
      }
      if (card.yaml) setYaml(card.yaml);
      else setYaml("");
      await draftCard({
        extractedText: extracted.text,
        extractedPages: extracted.pages,
        name: file.name,
        existingYaml: card.yaml ?? undefined,
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
  }) {
    const useText = opts?.extractedText ?? text;
    const usePages = opts?.extractedPages ?? pages;
    const useName = opts?.name ?? filename;
    const useExisting = opts?.existingYaml ?? existing?.yaml ?? undefined;
    setPhase("writing");
    setError(null);
    try {
      const res = await generateManifest({
        data: {
          text: useText.slice(0, 60_000),
          pages: usePages,
          filename: useName,
          existingYaml: useExisting,
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
      setPhase("review");
      setStep(2);
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

  async function runRace(asked: string) {
    const q = asked.trim();
    if (!q) return;
    setQuestion(q);
    setPhase("racing");
    setStep(3);
    setError(null);
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];

    const fullTokens = estimateTokens(text);
    const cardTokens = estimateTokens(yaml || " ");
    const fullMs = Math.round(Math.max(400, pages * ASSUMPTIONS.secondsPerPage * 1000));
    const cardMs = Math.round(ASSUMPTIONS.secondsPerCard * 1000);
    const started = performance.now();
    const target = pickPage(q, manifest, perPage);

    setPlain({ tokens: 0, ms: 0, label: `Reading page 1 of ${pages || 1}`, answer: "", done: false });
    setCarded({ tokens: 0, ms: 0, label: "Reading the card", answer: "", done: false });

    const play = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      timers.current.push(id);
    };

    const tick = 40;
    for (let t = 0; t <= cardMs; t += tick) {
      const p = Math.min(1, t / Math.max(1, cardMs));
      play(t, () => {
        setCarded({
          tokens: Math.round(cardTokens * p),
          ms: Math.round(performance.now() - started),
          label: target.page ? `Card → page ${target.page}` : "Reading the card",
          answer: "",
          done: false,
        });
      });
    }

    const askPromise = answerFromCard({
      data: { question: q, yaml, pageText: target.text, page: target.page },
    });

    play(cardMs + 10, () => {
      void (async () => {
        const res = await askPromise;
        setCarded({
          tokens: cardTokens,
          ms: Math.round(performance.now() - started),
          label: target.page ? `Answered from page ${target.page}` : "Card read",
          answer: res.ok ? res.answer : res.error,
          done: true,
        });
      })();
    });

    for (let t = 0; t <= fullMs; t += tick) {
      const p = Math.min(1, t / Math.max(1, fullMs));
      play(t, () => {
        setPlain({
          tokens: Math.round(fullTokens * p),
          ms: Math.round(performance.now() - started),
          label: `Reading page ${Math.max(1, Math.ceil(p * (pages || 1)))} of ${pages || 1}`,
          answer: "",
          done: false,
        });
      });
    }
    play(fullMs + 30, () => {
      setPlain({
        tokens: fullTokens,
        ms: fullMs,
        label: "Would have finished the file",
        answer: "Not run. Token count is measured from your file; this lane is a paced replay.",
        done: true,
      });
      setPhase("verdict");
    });
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
      setStep(4);
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
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ol
        className="flex shrink-0 justify-center gap-4 border-b border-rule px-4 py-2 text-xs tracking-[0.16em] text-muted uppercase sm:gap-6"
        aria-label="Steps"
      >
        <li className={step === 1 ? "text-oxblood" : ""}>i · drop</li>
        <li className={step === 2 ? "text-oxblood" : ""}>ii · review</li>
        <li className={step === 3 ? "text-oxblood" : ""}>iii · ask</li>
        <li className={step === 4 ? "text-oxblood" : ""}>iv · download</li>
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
            <Status title="Writing the card…" body="A frontier model is listing what this file is." />
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
              onBack={reset}
              onRegenerate={() => void draftCard()}
              onContinue={goAsk}
              onKeepAndRace={goAsk}
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
              verdict={verdict}
              error={error}
              onDownload={() => void attachAndDownload()}
              onAgain={() => {
                setPhase("ask");
                setPlain(null);
                setCarded(null);
              }}
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
        You get the same file back with a 1 KB card inside that AI tools and local
        models can read.
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
  onBack,
  onRegenerate,
  onContinue,
  onKeepAndRace,
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
  onBack: () => void;
  onRegenerate: () => void;
  onContinue: () => void;
  onKeepAndRace: () => void;
}) {
  const already = phase === "has_card";
  return (
    <div className="flex min-h-0 flex-col">
      <div className="shrink-0">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">{filename}</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">
          {already ? "This PDF already has a card." : "Review the card."}
        </h1>
        {stale ? (
          <p className="mt-2 text-sm text-warn">The text has changed since this card was written. Replace it.</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-warn" role="alert">
            {error}
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
          <SummaryCard manifest={manifest} pages={pages} />
        )}
      </div>
      <div className="mt-3 shrink-0 space-y-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={showYaml} onChange={(e) => setShowYaml(e.target.checked)} />
          Edit the raw card (YAML)
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {already ? (
            <>
              <button
                type="button"
                onClick={onKeepAndRace}
                className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep"
              >
                Keep it and race
              </button>
              <button type="button" onClick={onRegenerate} className="h-11 border border-rule px-5 text-sm">
                Replace the card
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onContinue}
                disabled={!validation?.ok}
                className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep disabled:opacity-50"
              >
                Looks right — continue
              </button>
              <button type="button" onClick={onRegenerate} className="h-11 border border-rule px-5 text-sm">
                Regenerate
              </button>
            </>
          )}
          <button type="button" onClick={onBack} className="h-11 px-3 text-sm text-muted">
            Back
          </button>
        </div>
      </div>
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
          {manifest.entities
            .map((e) => (typeof e === "string" ? e : String((e as { name?: string }).name ?? "")))
            .filter(Boolean)
            .join(" · ")}
        </p>
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
      <h1 className="font-display text-3xl sm:text-4xl">Now race it on your own document.</h1>
      <p className="mt-2 text-sm text-ink-soft">
        The card side answers for real. The plain side is a paced replay of the
        tokens your file would cost.
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
  verdict,
  error,
  onDownload,
  onAgain,
}: {
  question: string;
  plain: Lane | null;
  carded: Lane | null;
  finished: boolean;
  verdict: ReturnType<typeof documentVerdict>;
  error: string | null;
  onDownload: () => void;
  onAgain: () => void;
}) {
  return (
    <div className="min-h-0 overflow-y-auto">
      <p className="font-serif text-sm italic">“{question}”</p>
      {error ? (
        <p className="mt-2 text-sm text-warn" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <LaneView kicker="i" title="Plain PDF" lane={plain} />
        <LaneView kicker="ii" title="With the card" lane={carded} accent />
      </div>
      {finished ? (
        <div className="mt-4">
          <p className="font-display text-xl text-oxblood">{verdictPrimary(verdict)}</p>
          {verdict.moneyLine ? <p className="mt-1 text-sm text-ink-soft">{verdict.moneyLine}</p> : null}
          <p className="mt-2 text-xs text-faint">
            Plain lane: paced replay; token counts measured from your file. Card
            lane: a real answer from the card and the mapped page.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onDownload}
              className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink"
            >
              Attach the card and download
            </button>
            <button type="button" onClick={onAgain} className="h-11 border border-rule px-5 text-sm">
              Ask another
            </button>
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
}: {
  kicker: string;
  title: string;
  lane: Lane | null;
  accent?: boolean;
}) {
  return (
    <div className={`border border-rule p-3 ${accent ? "bg-paper-2/40" : "bg-folio"}`}>
      <p className="text-xs tracking-[0.14em] text-muted uppercase">{kicker}</p>
      <h3 className="font-display text-lg">{title}</h3>
      {lane ? (
        <>
          <p className="mt-2 text-xs text-ink-soft">{lane.label}</p>
          <p className="font-display text-2xl tabular-nums">{lane.tokens.toLocaleString("en-GB")}</p>
          <p className="text-xs text-muted">{(lane.ms / 1000).toFixed(2)}s</p>
          {lane.done && lane.answer ? <p className="mt-2 text-sm text-ink-soft">{lane.answer}</p> : null}
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
