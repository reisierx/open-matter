import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ASSUMPTIONS, fleetSavings, formatHours, formatMultiple, formatUsd } from "@/lib/savings";

export function SavingsCalculator() {
  const [documents, setDocuments] = useState(1000);
  const [pages, setPages] = useState(12);
  const [reads, setReads] = useState(20);

  const result = useMemo(
    () => fleetSavings({ documents, pages, readsPerDocument: reads }),
    [documents, pages, reads],
  );

  const money = formatUsd(result.usdSaved);

  return (
    <div className="border border-rule bg-folio px-4 py-6 sm:px-6">
      <p className="text-xs tracking-[0.18em] text-oxblood uppercase">Your numbers</p>
      <h2 className="mt-1 font-display text-2xl sm:text-3xl">What it costs your archive</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Writing each card costs one full read. Value starts at the second read.
        Time is wall-clock ingest, not billed tokens.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Field label="Documents" value={documents} min={1} max={1_000_000} onChange={setDocuments} />
        <Field label="Average pages" value={pages} min={1} max={500} onChange={setPages} />
        <Field label="Reads per document / year" value={reads} min={1} max={500} onChange={setReads} />
      </div>

      <p className="mt-4 text-xs text-faint">
        Assumptions, stated: {ASSUMPTIONS.tokensPerPage} tokens/page,{" "}
        {ASSUMPTIONS.cardTokens}-token card, {ASSUMPTIONS.secondsPerPage}s/page,{" "}
        {ASSUMPTIONS.secondsPerCard}s/card, ${ASSUMPTIONS.usdPerMillion} per million
        input tokens. Writing the card is included as one full read per document.
        Inputs stay in this browser.
      </p>

      <div className="mt-6 border-t border-rule pt-5">
        {!result.breakEven ? (
          <p className="font-display text-xl text-ink sm:text-2xl">
            At one read per document, cards cost more than they save. The write is
            a full parse. Savings start at read two.
          </p>
        ) : (
          <>
            <p className="font-display text-xl text-oxblood sm:text-2xl">
              {formatMultiple(result.tokenMultiple)} fewer tokens ·{" "}
              {Math.round(result.pctCheaper)}% cheaper
              {money ? ` · ${money} / year` : ""} · {formatHours(result.hoursSaved)} of
              model time
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Without cards: {formatUsd(result.usdWithout) ?? "under $1"} and{" "}
              {formatHours(result.hoursWithout)}. With cards (including the write):{" "}
              {formatUsd(result.usdWith) ?? "under $1"} and {formatHours(result.hoursWith)}.
            </p>
          </>
        )}
        <Link
          to="/"
          hash="waitlist"
          className="mt-5 inline-flex h-11 items-center border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink no-underline hover:bg-oxblood-deep hover:text-oxblood-ink"
        >
          Get this for your archive
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs tracking-[0.12em] text-muted uppercase">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          onChange(Math.min(max, Math.max(min, Math.round(n))));
        }}
        className="mt-1 h-11 w-full border border-rule bg-paper px-3 font-serif text-base tabular-nums text-ink"
      />
    </label>
  );
}
