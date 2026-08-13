/** Honest savings math. Assumptions are always shown next to the numbers. */

export const ASSUMPTIONS = {
  /** Mid-range input price, stated on the page. */
  usdPerMillion: 3,
  /** Measured on the 8-page sample (~1764 tokens / 8 pages). */
  tokensPerPage: 220,
  /** A typical 1 KB card. */
  cardTokens: 220,
  charsPerToken: 4,
} as const;

export type FleetInput = {
  documents: number;
  pages: number;
  readsPerDocument: number;
  usdPerMillion?: number;
  tokensPerPage?: number;
  cardTokens?: number;
};

export type FleetResult = {
  tokensWithout: number;
  tokensWith: number;
  tokensSaved: number;
  usdWithout: number;
  usdWith: number;
  usdSaved: number;
  pctCheaper: number;
  tokenMultiple: number;
  breakEven: boolean;
  writeCostTokens: number;
};

export function fleetSavings(input: FleetInput): FleetResult {
  const docs = Math.max(0, input.documents);
  const pages = Math.max(1, input.pages);
  const reads = Math.max(1, input.readsPerDocument);
  const price = input.usdPerMillion ?? ASSUMPTIONS.usdPerMillion;
  const tpp = input.tokensPerPage ?? ASSUMPTIONS.tokensPerPage;
  const card = input.cardTokens ?? ASSUMPTIONS.cardTokens;
  const full = pages * tpp;

  const tokensWithout = docs * full * reads;
  const writeCostTokens = docs * full;
  const tokensWith = writeCostTokens + docs * card * reads;
  const tokensSaved = tokensWithout - tokensWith;
  const usdWithout = (tokensWithout / 1_000_000) * price;
  const usdWith = (tokensWith / 1_000_000) * price;
  const usdSaved = usdWithout - usdWith;
  const pctCheaper = tokensWithout === 0 ? 0 : (1 - tokensWith / tokensWithout) * 100;
  const tokenMultiple = tokensWith === 0 ? 0 : tokensWithout / tokensWith;

  return {
    tokensWithout,
    tokensWith,
    tokensSaved,
    usdWithout,
    usdWith,
    usdSaved,
    pctCheaper,
    tokenMultiple,
    breakEven: reads >= 2,
    writeCostTokens,
  };
}

export function formatUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1000) return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (abs >= 10) return `${sign}$${abs.toFixed(0)}`;
  if (abs >= 1) return `${sign}$${abs.toFixed(2)}`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatMultiple(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${n.toFixed(n >= 10 ? 0 : 1)}×`;
}

export function trioLine(opts: {
  tokenMultiple: number;
  speedMultiple?: number;
  pctCheaper: number;
  usdSaved: number;
  scope: string;
}): string {
  const speed = opts.speedMultiple
    ? ` · ${formatMultiple(opts.speedMultiple)} faster`
    : "";
  return `${formatMultiple(opts.tokenMultiple)} fewer tokens${speed} · ${Math.round(opts.pctCheaper)}% cheaper per read · ${formatUsd(opts.usdSaved)} ${opts.scope}`;
}

export function perDocumentTrio(fullTokens: number, cardTokens: number, usdPerMillion = ASSUMPTIONS.usdPerMillion) {
  const multiple = cardTokens > 0 ? fullTokens / cardTokens : 0;
  const pct = fullTokens > 0 ? (1 - cardTokens / fullTokens) * 100 : 0;
  const usd = ((fullTokens - cardTokens) / 1_000_000) * usdPerMillion;
  return { multiple, pct, usd };
}
