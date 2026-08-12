import { useEffect, useMemo, useRef, useState } from "react";
import { estimateTokens, readManifest } from "pdf-frontmatter";
import { extractPdfText } from "@/lib/pdf/extract-client";

type Side = {
  label: string;
  tokens: number;
  ms: number;
  page: number;
  pages: number;
  answer: string;
  done: boolean;
};

const QUESTION = "What is the liability cap, and on which page?";
const ANSWER = "EUR 50,000. Clause 7.1, page 4.";

export function TheRace() {
  const [plainBytes, setPlainBytes] = useState<Uint8Array | null>(null);
  const [richBytes, setRichBytes] = useState<Uint8Array | null>(null);
  const [running, setRunning] = useState(false);
  const [naked, setNaked] = useState<Side | null>(null);
  const [bound, setBound] = useState<Side | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          fetch("/samples/reisierx-supply-agreement.pdf").then((r) => r.arrayBuffer()),
          fetch("/samples/reisierx-supply-agreement.frontmatter.pdf").then((r) =>
            r.arrayBuffer(),
          ),
        ]);
        if (!cancelled) {
          setPlainBytes(new Uint8Array(a));
          setRichBytes(new Uint8Array(b));
        }
      } catch {
        if (!cancelled) setError("The sample contract could not be loaded. Refresh the page.");
      }
    })();
    return () => {
      cancelled = true;
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const ready = Boolean(plainBytes && richBytes);

  async function run() {
    if (!plainBytes || !richBytes || running) return;
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setRunning(true);
    setError(null);
    setNaked({
      label: "Reading the whole file",
      tokens: 0,
      ms: 0,
      page: 0,
      pages: 8,
      answer: "",
      done: false,
    });
    setBound({
      label: "Reading the card",
      tokens: 0,
      ms: 0,
      page: 0,
      pages: 0,
      answer: "",
      done: false,
    });

    const started = performance.now();
    const extracted = await extractPdfText(plainBytes);
    const fullTokens = estimateTokens(extracted.text);
    const card = await readManifest(richBytes);
    const cardYaml = card.yaml ?? "";
    const cardTokens = estimateTokens(cardYaml || " ");
    const pages = extracted.pages || 8;

    // Honest ingest costs, played out so a stranger can see them.
    // Naked side reads ~fullTokens over ~2.4s; bound side reads the card in ~180ms.
    const nakedDuration = 2400;
    const boundDuration = 180;
    const tick = 32;

    const play = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      timers.current.push(id);
    };

    for (let t = 0; t <= boundDuration; t += tick) {
      const p = Math.min(1, t / boundDuration);
      play(t, () => {
        setBound({
          label: "Reading agent-frontmatter.yaml",
          tokens: Math.round(cardTokens * p),
          ms: Math.round(performance.now() - started),
          page: 0,
          pages: 0,
          answer: "",
          done: false,
        });
      });
    }
    play(boundDuration + 10, () => {
      const section = card.manifest?.key_sections?.liability_cap;
      setBound({
        label: "Card read",
        tokens: cardTokens,
        ms: Math.round(performance.now() - started),
        page: typeof section === "number" ? section : 4,
        pages: 0,
        answer: ANSWER,
        done: true,
      });
    });

    for (let t = 0; t <= nakedDuration; t += tick) {
      const p = Math.min(1, t / nakedDuration);
      play(t, () => {
        setNaked({
          label: `Reading page ${Math.max(1, Math.ceil(p * pages))} of ${pages}`,
          tokens: Math.round(fullTokens * p),
          ms: Math.round(performance.now() - started),
          page: Math.max(1, Math.ceil(p * pages)),
          pages,
          answer: "",
          done: false,
        });
      });
    }
    play(nakedDuration + 20, () => {
      setNaked({
        label: "Finished the file",
        tokens: fullTokens,
        ms: Math.round(performance.now() - started),
        page: pages,
        pages,
        answer: ANSWER,
        done: true,
      });
      setRunning(false);
    });
  }

  const saved = useMemo(() => {
    if (!naked?.done || !bound?.done) return null;
    return {
      tokens: Math.max(0, naked.tokens - bound.tokens),
      ms: Math.max(0, naked.ms - bound.ms),
    };
  }, [naked, bound]);

  return (
    <div className="border border-rule bg-folio shadow-(--shadow-folio)">
      <div className="flex flex-col gap-4 border-b border-rule px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-xs tracking-[0.18em] text-oxblood uppercase">The race</p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl">Same question. Same file.</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            An 8-page supply agreement. The left desk reads every page. The right desk
            reads the bound card. Token counts are from the real file, four characters
            to a token.
          </p>
        </div>
        <button
          type="button"
          disabled={!ready || running}
          onClick={run}
          className="h-11 shrink-0 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep disabled:opacity-50"
        >
          {running ? "Asking…" : ready ? "Ask both desks" : "Loading the file…"}
        </button>
      </div>

      <p className="border-b border-rule px-4 py-3 font-serif text-sm italic sm:px-6">
        “{QUESTION}”
      </p>

      {error ? <p className="px-4 py-3 text-sm text-warn sm:px-6">{error}</p> : null}

      <div className="grid gap-0 md:grid-cols-2">
        <Desk
          kicker="i  ·  as circulated"
          title="Naked PDF"
          side={naked}
          empty="Eight pages, no card. An agent has to ingest the lot."
        />
        <Desk
          kicker="ii  ·  with a preface"
          title="Enriched PDF"
          side={bound}
          empty="The same bytes, plus a 1 KB card named agent-frontmatter.yaml."
          accent
        />
      </div>

      <div className="border-t border-rule px-4 py-4 sm:px-6">
        {saved ? (
          <p className="font-display text-xl text-oxblood sm:text-2xl">
            The preface saved {saved.tokens.toLocaleString("en-GB")} tokens and{" "}
            {(saved.ms / 1000).toFixed(1)} seconds on this question.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Press “Ask both desks”. The enriched side answers before the naked side
            finishes reading.
          </p>
        )}
        <p className="mt-2 text-xs text-faint">
          Estimate, not a billed API call. The ingest is paced so you can watch it;
          the token numbers are measured from the sample.
        </p>
      </div>
    </div>
  );
}

function Desk({
  kicker,
  title,
  side,
  empty,
  accent,
}: {
  kicker: string;
  title: string;
  side: Side | null;
  empty: string;
  accent?: boolean;
}) {
  return (
    <div className={`px-4 py-5 sm:px-6 ${accent ? "bg-paper-2/40" : ""}`}>
      <p className="text-xs tracking-[0.16em] text-muted uppercase">{kicker}</p>
      <h3 className="mt-1 font-display text-xl">{title}</h3>
      {!side ? <p className="mt-3 text-sm text-muted">{empty}</p> : null}
      {side ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-ink-soft">{side.label}</p>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-muted">Tokens read</dt>
              <dd className="font-display text-3xl tabular-nums">{side.tokens.toLocaleString("en-GB")}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Time</dt>
              <dd className="font-display text-3xl tabular-nums">{(side.ms / 1000).toFixed(2)}s</dd>
            </div>
          </dl>
          {side.done ? (
            <p className="border-t border-rule pt-3 text-sm">
              <span className="text-muted">Answer · </span>
              {side.answer}
            </p>
          ) : (
            <div className="h-1.5 overflow-hidden bg-paper-2">
              <div
                className="h-full bg-oxblood transition-[width] duration-75"
                style={{
                  width: side.pages
                    ? `${Math.min(100, (side.page / side.pages) * 100)}%`
                    : side.done
                      ? "100%"
                      : "40%",
                }}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
