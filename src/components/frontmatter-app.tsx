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
} from "pdf-frontmatter";
import { generateManifest } from "@/lib/server/generate";
import { recordEnrichment } from "@/lib/server/stats";
import { extractPdfText } from "@/lib/pdf/extract-client";
import { ASSUMPTIONS, formatMultiple, formatUsd, perDocumentTrio } from "@/lib/savings";

const MAX_BYTES = 8 * 1024 * 1024;

type Phase =
  | "idle"
  | "loading"
  | "generating"
  | "review"
  | "has_card"
  | "binding"
  | "done"
  | "error";

export function FrontmatterApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [filename, setFilename] = useState("");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState(0);
  const [text, setText] = useState("");
  const [existing, setExisting] = useState<ReadResult | null>(null);
  const [yaml, setYaml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showYaml, setShowYaml] = useState(false);
  const [savedName, setSavedName] = useState("");

  const validation = useMemo(() => (yaml.trim() ? parseManifest(yaml) : null), [yaml]);
  const manifest = validation?.ok ? validation.value : existing?.manifest ?? null;

  const trio = useMemo(() => {
    const full = estimateTokens(text);
    const card = estimateTokens(yaml || " ");
    return perDocumentTrio(full, card);
  }, [text, yaml]);

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    setShowYaml(false);
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
    setPhase("loading");
    setStep(1);
    setFilename(file.name);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const extracted = await extractPdfText(buf);
      const card = await readManifest(buf, { extractedText: extracted.text });
      setPdfBytes(buf);
      setPages(extracted.pages);
      setText(extracted.text);
      setExisting(card);
      if (card.yaml && card.manifest && !card.stale) {
        setYaml(card.yaml);
        setPhase("has_card");
        setStep(2);
        return;
      }
      if (card.yaml) setYaml(card.yaml);
      else setYaml("");
      setPhase("generating");
      await draftCard({
        buf,
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
    buf?: Uint8Array;
    extractedText?: string;
    extractedPages?: number;
    name?: string;
    existingYaml?: string;
  }) {
    const useText = opts?.extractedText ?? text;
    const usePages = opts?.extractedPages ?? pages;
    const useName = opts?.name ?? filename;
    const useExisting = opts?.existingYaml ?? existing?.yaml ?? undefined;
    setPhase("generating");
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
        setError(res.error);
        setPhase("review");
        setStep(2);
        return;
      }
      const hash = await contentSha256(useText);
      const parsed = parseManifest(res.yaml);
      if (parsed.ok) {
        setYaml(stringifyManifest({ ...parsed.value, content_sha256: hash, pages: usePages }));
      } else {
        setYaml(res.yaml);
      }
      setPhase("review");
      setStep(2);
    } catch {
      if (!yaml.trim()) starterCard(useName, usePages, useText);
      setError("The model could not write the card. Edit it yourself, or try again.");
      setPhase("review");
      setStep(2);
    }
  }

  function starterCard(name = filename, pageCount = pages, body = text) {
    const stub: Manifest = {
      spec: "pdf-frontmatter/0.1",
      title: name.replace(/\.pdf$/i, "") || "Untitled document",
      pages: pageCount,
      summary: "",
      extraction: { scanned: body.length < 40 },
    };
    setYaml(stringifyManifest(stub));
  }

  async function attachAndDownload() {
    if (!pdfBytes) return;
    const parsed = parseManifest(yaml);
    if (!parsed.ok) {
      setError(parsed.error);
      setShowYaml(true);
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
      setPhase("review");
      setError(err instanceof Error ? err.message : "The card could not be attached. Try again.");
    }
  }

  function reset() {
    setPhase("idle");
    setStep(1);
    setFilename("");
    setPdfBytes(null);
    setPages(0);
    setText("");
    setExisting(null);
    setYaml("");
    setError(null);
    setShowYaml(false);
    setSavedName("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ol
        className="flex shrink-0 justify-center gap-6 border-b border-rule px-4 py-2 text-xs tracking-[0.18em] text-muted uppercase"
        aria-label="Steps"
      >
        <li className={step === 1 ? "text-oxblood" : ""}>i · drop</li>
        <li className={step === 2 ? "text-oxblood" : ""}>ii · review</li>
        <li className={step === 3 ? "text-oxblood" : ""}>iii · download</li>
      </ol>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-4 sm:px-6">
        <div className="flex max-h-full w-full max-w-xl flex-col">
          {phase === "idle" || (phase === "error" && !pdfBytes) ? (
            <Idle
              dragging={dragging}
              setDragging={setDragging}
              error={error}
              onPick={() => inputRef.current?.click()}
              onFile={(f) => void loadFile(f)}
              onSample={() => {
                void fetch("/samples/reisierx-supply-agreement.pdf")
                  .then((r) => {
                    if (!r.ok) throw new Error("sample missing");
                    return r.blob();
                  })
                  .then((b) =>
                    new File([b], "reisierx-supply-agreement.pdf", { type: "application/pdf" }),
                  )
                  .then(loadFile)
                  .catch(() => {
                    setPhase("error");
                    setError("The sample contract could not be loaded. Refresh and try again.");
                  });
              }}
            />
          ) : null}

          {phase === "loading" ? (
            <Status title={`Reading${pages ? ` ${pages} pages` : ""}…`} body={filename} />
          ) : null}

          {phase === "generating" ? (
            <Status
              title="Writing the card…"
              body="A model is listing what this file is and where the sections live."
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
              onBack={reset}
              onRegenerate={() => void draftCard()}
              onAttach={() => void attachAndDownload()}
              onKeep={() => void attachAndDownload()}
            />
          ) : null}

          {phase === "done" ? (
            <Done
              savedName={savedName}
              trio={trio}
              onAgain={reset}
              onVerify={() => inputRef.current?.click()}
            />
          ) : null}

          {phase === "error" && pdfBytes ? (
            <div className="space-y-4">
              <p className="text-sm text-warn" role="alert">
                {error}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="h-11 border border-rule px-5 text-sm"
                >
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
  onSample,
}: {
  dragging: boolean;
  setDragging: (v: boolean) => void;
  error: string | null;
  onPick: () => void;
  onFile: (f: File) => void;
  onSample: () => void;
}) {
  return (
    <div>
      <h1 className="font-display text-4xl sm:text-5xl">Drop a PDF.</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        You get the same file back with a 1 KB card inside that AI tools can read.
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
        className={`mt-6 border border-dashed px-4 py-8 text-center ${
          dragging ? "border-oxblood bg-paper-2" : "border-rule-strong bg-folio"
        }`}
      >
        <p className="text-sm text-muted">PDF, up to 8 MB.</p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPick}
            className="h-11 min-w-40 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep"
          >
            Choose a PDF
          </button>
          <button
            type="button"
            onClick={onSample}
            className="h-11 min-w-40 border border-rule px-5 text-sm text-ink-soft hover:border-ink hover:text-ink"
          >
            Use the sample contract
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-warn" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-faint">
        The file is read in your browser. A model sees the extracted text long
        enough to write the card, then forgets it. Nothing is stored.
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
  onAttach,
  onKeep,
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
  onAttach: () => void;
  onKeep: () => void;
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
          <p className="mt-2 text-sm text-warn">
            The text has changed since this card was written. Replace it.
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-warn" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        {showYaml ? (
          <div className="flex h-full min-h-0 flex-col">
            <textarea
              value={yaml}
              onChange={(e) => setYaml(e.target.value)}
              spellCheck={false}
              aria-label="Raw card YAML"
              className="min-h-40 w-full flex-1 resize-none overflow-y-auto border border-rule bg-ink p-3 text-xs leading-relaxed text-paper"
            />
            {validation && !validation.ok ? (
              <p className="mt-2 text-xs text-warn">{validation.error}</p>
            ) : (
              <p className="mt-2 text-xs text-ok">Valid YAML. Ready to attach.</p>
            )}
          </div>
        ) : (
          <SummaryCard manifest={manifest} pages={pages} />
        )}
      </div>

      <div className="mt-4 shrink-0 space-y-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={showYaml}
            onChange={(e) => setShowYaml(e.target.checked)}
          />
          Edit the raw card (YAML)
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {already ? (
            <>
              <button
                type="button"
                onClick={onKeep}
                className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep"
              >
                Keep it, just download
              </button>
              <button
                type="button"
                onClick={onRegenerate}
                className="h-11 border border-rule px-5 text-sm"
              >
                Replace the card
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onAttach}
                disabled={!validation?.ok}
                className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep disabled:opacity-50"
              >
                Looks right — attach it
              </button>
              <button
                type="button"
                onClick={onRegenerate}
                className="h-11 border border-rule px-5 text-sm"
              >
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
    <div className="max-h-64 space-y-3 overflow-y-auto border border-rule bg-folio p-4 sm:max-h-80">
      <p className="font-display text-2xl">{manifest.title}</p>
      <p className="text-sm text-muted">
        {[manifest.doc_type, manifest.language, `${manifest.pages ?? pages} pages`]
          .filter(Boolean)
          .join(" · ")}
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

function Done({
  savedName,
  trio,
  onAgain,
  onVerify,
}: {
  savedName: string;
  trio: { multiple: number; pct: number; usd: number };
  onAgain: () => void;
  onVerify: () => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Done.</h1>
      <p className="mt-3 text-ink-soft">
        <span className="font-medium text-ink">{savedName}</span> saved. Same file,
        plus a 1 KB card inside. Drop it back in anytime to see or update the card.
      </p>
      <p className="mt-4 font-display text-xl text-oxblood">
        Future reads of this file: {formatMultiple(trio.multiple)} fewer tokens ·{" "}
        {Math.round(trio.pct)}% cheaper · ≈{formatUsd(trio.usd)} at $
        {ASSUMPTIONS.usdPerMillion}/M
      </p>
      <p className="mt-2 text-xs text-faint">
        Mac Preview will not list the attachment. Acrobat will. So will this app, if
        you drop the file back in.
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
