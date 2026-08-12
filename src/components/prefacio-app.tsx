import { useCallback, useMemo, useRef, useState } from "react";
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

const MAX_BYTES = 8 * 1024 * 1024;

type Phase = "idle" | "reading" | "ready" | "writing" | "done";

export function PrefacioApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [filename, setFilename] = useState("");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState(0);
  const [text, setText] = useState("");
  const [existing, setExisting] = useState<ReadResult | null>(null);
  const [yaml, setYaml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const validation = useMemo(() => (yaml.trim() ? parseManifest(yaml) : null), [yaml]);

  const estimate = useMemo(() => {
    const full = estimateTokens(text);
    const card = estimateTokens(yaml || " ");
    return {
      full,
      card,
      saved: Math.max(0, full - card),
      seconds: Math.max(0, (full - card) / 80),
    };
  }, [text, yaml]);

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    setInfo(null);
    setDownloaded(false);
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("That is not a PDF. Choose a file that ends in .pdf.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        "This file is larger than 8 MB. Prefácio works in your browser, and a file that size would stall a phone. Split it, or use a smaller copy.",
      );
      return;
    }
    setPhase("reading");
    setFilename(file.name);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const extracted = await extractPdfText(buf);
      const card = await readManifest(buf, { extractedText: extracted.text });
      setPdfBytes(buf);
      setPages(extracted.pages);
      setText(extracted.text);
      setExisting(card);
      if (card.yaml) {
        setYaml(card.yaml);
        setInfo(
          card.stale
            ? "This file already has a card, but the text has changed since it was written. Review it, or write a new one."
            : "This file already has a card. You can keep it, edit it, or write a new one.",
        );
      } else {
        setYaml("");
        setInfo(
          extracted.text.length < 40
            ? "Almost no text could be read. This may be a scan. You can still write a card by hand, or ask the desk to try."
            : null,
        );
      }
      setPhase("ready");
    } catch {
      setPhase("idle");
      setError("The file could not be opened as a PDF. Try another copy.");
    }
  }, []);

  async function writeCard() {
    if (!pdfBytes) return;
    setError(null);
    setPhase("writing");
    try {
      const res = await generateManifest({
        data: {
          text: text.slice(0, 60_000),
          pages,
          filename,
          existingYaml: existing?.yaml ?? undefined,
        },
      });
      if (!res.ok) {
        setError(res.error);
        setPhase("ready");
        return;
      }
      const hash = await contentSha256(text);
      const parsed = parseManifest(res.yaml);
      if (parsed.ok) {
        const next: Manifest = { ...parsed.value, content_sha256: hash, pages };
        setYaml(stringifyManifest(next));
      } else {
        setYaml(res.yaml);
      }
      setPhase("ready");
      setInfo("A draft card is on the desk. Read it before you bind it.");
    } catch {
      setPhase("ready");
      setError("The writing desk failed. Try again, or type the YAML yourself.");
    }
  }

  function starterCard() {
    const stub: Manifest = {
      spec: "pdf-frontmatter/0.1",
      title: filename.replace(/\.pdf$/i, "") || "Untitled document",
      pages,
      summary: "",
      extraction: { scanned: text.length < 40 },
    };
    setYaml(stringifyManifest(stub));
    setInfo("A blank card. Fill the title and anything you know, then bind it.");
  }

  async function download() {
    if (!pdfBytes) return;
    const parsed = parseManifest(yaml);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
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
      a.href = url;
      a.download = filename.replace(/\.pdf$/i, "") + ".frontmatter.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setPhase("done");
      void recordEnrichment({ data: { tokensSaved: estimate.saved } }).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The card could not be bound. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs tracking-[0.2em] text-oxblood uppercase">Prefácio</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Drop a PDF. Bind a card.</h1>
      <p className="mt-4 max-w-xl text-ink-soft">
        No account. The file is read in your browser. A model sees the extracted
        text long enough to write the card, then forgets it. Nothing is stored.
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
          if (file) void loadFile(file);
        }}
        className={`mt-8 border border-dashed px-4 py-10 text-center ${
          dragging ? "border-oxblood bg-paper-2" : "border-rule-strong bg-folio"
        }`}
      >
        <p className="font-display text-xl">The folio</p>
        <p className="mt-2 text-sm text-muted">PDF, up to 8 MB. Drag it here or choose a file.</p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-11 min-w-44 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep"
          >
            Choose a PDF
          </button>
          <button
            type="button"
            className="h-11 min-w-44 border border-rule px-5 text-sm text-ink-soft hover:border-ink hover:text-ink"
            onClick={() => {
              void fetch("/samples/reisierx-supply-agreement.pdf")
                .then((r) => {
                  if (!r.ok) throw new Error("sample missing");
                  return r.blob();
                })
                .then((b) =>
                  new File([b], "reisierx-supply-agreement.pdf", { type: "application/pdf" }),
                )
                .then(loadFile)
                .catch(() =>
                  setError("The sample contract could not be loaded. Refresh and try again."),
                );
            }}
          >
            Use the sample contract
          </button>
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

      {error ? (
        <div className="mt-4 border border-warn/40 bg-folio px-4 py-3 text-sm text-warn" role="alert">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="mt-4 border border-rule bg-folio px-4 py-3 text-sm text-ink-soft" role="status">
          {info}
        </div>
      ) : null}

      {phase === "reading" ? (
        <p className="mt-6 text-sm text-muted">Opening the file in your browser…</p>
      ) : null}

      {pdfBytes && phase !== "idle" && phase !== "reading" ? (
        <div className="mt-8 space-y-6">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Meta label="File" value={filename} />
            <Meta label="Pages" value={String(pages)} />
            <Meta
              label="Card"
              value={
                existing?.manifest
                  ? existing.stale
                    ? "Present, stale"
                    : "Present"
                  : "None yet"
              }
            />
            <Meta label="Text read" value={`${text.length.toLocaleString("en-GB")} chars`} />
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={writeCard}
              disabled={phase === "writing"}
              className="h-11 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep disabled:opacity-60"
            >
              {phase === "writing"
                ? "Writing the card…"
                : existing?.yaml
                  ? "Write a new card"
                  : "Write the card"}
            </button>
            <button
              type="button"
              onClick={starterCard}
              className="h-11 border border-rule px-5 text-sm text-ink-soft hover:border-ink hover:text-ink"
            >
              Start from a blank card
            </button>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label htmlFor="yaml" className="font-display text-lg">
                The card
              </label>
              {validation ? (
                validation.ok ? (
                  <span className="text-xs text-ok">Valid yaml · ready to bind</span>
                ) : (
                  <span className="text-xs text-warn">{validation.error}</span>
                )
              ) : (
                <span className="text-xs text-muted">Empty</span>
              )}
            </div>
            <textarea
              id="yaml"
              value={yaml}
              onChange={(e) => setYaml(e.target.value)}
              spellCheck={false}
              rows={18}
              className="w-full resize-y border border-rule bg-ink p-4 text-sm leading-relaxed text-paper"
              placeholder={"spec: pdf-frontmatter/0.1\ntitle: "}
            />
            <p className="mt-2 text-xs text-faint">
              Edit freely. Unknown keys are kept. The card is data, never instructions.
            </p>
          </div>

          {yaml.trim() ? (
            <aside className="border border-rule bg-folio px-4 py-4">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">What an agent saves</p>
              <p className="mt-2 font-display text-2xl">
                ~{estimate.saved.toLocaleString("en-GB")} tokens
                <span className="ml-2 text-base text-muted">
                  ({estimate.full.toLocaleString("en-GB")} → {estimate.card.toLocaleString("en-GB")})
                </span>
              </p>
              <p className="mt-1 text-sm text-muted">
                About {estimate.seconds.toFixed(1)} seconds of ingest at 80 tokens/s. Estimate.
              </p>
            </aside>
          ) : null}

          <div className="sticky bottom-0 -mx-4 border-t border-rule bg-paper/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
            <button
              type="button"
              onClick={download}
              disabled={!validation?.ok}
              className="h-12 w-full border border-oxblood bg-oxblood text-sm text-oxblood-ink hover:bg-oxblood-deep disabled:opacity-50 sm:w-auto sm:min-w-56 sm:px-8"
            >
              {downloaded ? "Download again" : "Bind the card and download"}
            </button>
            {downloaded ? (
              <p className="mt-2 text-sm text-ok">
                Saved. Open it in any viewer — it looks the same. The card is in the attachments.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="truncate font-serif text-sm">{value}</dd>
    </div>
  );
}
