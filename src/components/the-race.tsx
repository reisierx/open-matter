import { useEffect, useMemo, useRef, useState } from "react";
import { estimateTokens, readManifest } from "pdf-frontmatter";
import { extractPdfText } from "@/lib/pdf/extract-client";
import { documentVerdict, verdictPrimary } from "@/lib/savings";

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
  const [measured, setMeasured] = useState<{ full: number; card: number } | null>(null);
  const timers = useRef<number[]>([]);
  const autoplayed = useRef(false);
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          fetch("/samples/reisierx-supply-agreement.pdf").then((r) => r.arrayBuffer()),
          fetch("/samples/reisierx-supply-agreement.frontmatter.pdf").then((r) => r.arrayBuffer()),
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
      label: "Reading every page",
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
    const cardTokens = estimateTokens(card.yaml || " ");
    const pages = extracted.pages || 8;
    setMeasured({ full: fullTokens, card: cardTokens });

    const nakedDuration = reduceMotion ? 0 : 2400;
    const boundDuration = reduceMotion ? 0 : 180;
    const tick = 32;

    const play = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      timers.current.push(id);
    };

    for (let t = 0; t <= boundDuration; t += tick) {
      const p = Math.min(1, t / Math.max(1, boundDuration));
      play(t, () => {
        setBound({
          label: "Reading the 1 KB card",
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
      const p = Math.min(1, t / Math.max(1, nakedDuration));
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

  useEffect(() => {
    if (!ready || autoplayed.current) return;
    autoplayed.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const saved = useMemo(() => {
    if (!naked?.done || !bound?.done) return null;
    return documentVerdict(naked.tokens, bound.tokens, naked.ms / 1000, Math.max(0.05, bound.ms / 1000));
  }, [naked, bound]);

  return (
    <div className="border border-rule bg-folio shadow-(--shadow-folio)">
      <div className="flex flex-col gap-4 border-b border-rule px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-xs tracking-[0.18em] text-oxblood uppercase">The race</p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl">Same question. Same file.</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            An 8-page supply agreement. One side reads every page. The other reads
            the card inside. Token counts are measured from the real file.
          </p>
        </div>
        <button
          type="button"
          disabled={!ready || running}
          onClick={() => void run()}
          className="h-11 shrink-0 border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink hover:bg-oxblood-deep disabled:opacity-50"
        >
          {running ? "Running…" : ready ? "Replay" : "Loading the file…"}
        </button>
      </div>

      <p className="border-b border-rule px-4 py-3 font-serif text-sm italic sm:px-6">
        “{QUESTION}”
      </p>

      {error ? <p className="px-4 py-3 text-sm text-warn sm:px-6">{error}</p> : null}

      <div className="grid gap-0 md:grid-cols-2">
        <Desk
          kicker="i"
          title="Plain PDF"
          side={naked}
          empty="Eight pages, no card. Every read pays the full parse."
        />
        <Desk
          kicker="ii"
          title="With the card inside"
          side={bound}
          empty="The same file, plus a 1 KB card named agent-frontmatter.yaml."
          accent
        />
      </div>

      <div className="border-t border-rule px-4 py-4 sm:px-6">
        {saved ? (
          <>
            <p className="font-display text-xl text-oxblood sm:text-2xl">{verdictPrimary(saved)}</p>
            {saved.moneyLine ? <p className="mt-1 text-sm text-ink-soft">{saved.moneyLine}</p> : null}
          </>
        ) : (
          <p className="text-sm text-muted">
            Watch both sides. The card side answers first. Writing the card cost one
            full read — this is the second.
          </p>
        )}
        <p className="mt-2 text-xs text-faint">
          Estimate, paced so you can watch it. Tokens are measured from the sample
          ({measured ? `${measured.full} vs ${measured.card}` : "loading…"}), four
          characters to a token. Tools that do not look for the card still read the
          whole PDF.
        </p>
        <a
          href="/app"
          className="mt-4 inline-flex h-11 items-center border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink no-underline hover:bg-oxblood-deep hover:text-oxblood-ink"
        >
          Now run it on your own PDF
        </a>
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
              <dd className="font-display text-3xl tabular-nums">
                {side.tokens.toLocaleString("en-GB")}
              </dd>
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
