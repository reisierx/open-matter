/** Honest savings math. Assumptions are always shown next to the numbers. */

export const ASSUMPTIONS = {
  usdPerMillion: 3,
  /** Measured on the 8-page sample (~1764 tokens / 8 pages). */
  tokensPerPage: 220,
  /** A typical 1 KB card. */
  cardTokens: 220,
  charsPerToken: 4,
  /** Measured ingest on the sample (~2.4s / 8 pages). */
  secondsPerPage: 0.3,
  /** Card read, wall clock. */
  secondsPerCard: 0.2,
} as const;

export const MONEY_FLOOR = 1;

export type FleetInput = {
  documents: number;
  pages: number;
  readsPerDocument: number;
  usdPerMillion?: number;
  tokensPerPage?: number;
  cardTokens?: number;
  secondsPerPage?: number;
  secondsPerCard?: number;
};

export type FleetResult = {
  tokensWithout: number;
  tokensWith: number;
  tokensSaved: number;
  usdWithout: number;
  usdWith: number;
  usdSaved: number;
  hoursWithout: number;
  hoursWith: number;
  hoursSaved: number;
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
  const secPage = input.secondsPerPage ?? ASSUMPTIONS.secondsPerPage;
  const secCard = input.secondsPerCard ?? ASSUMPTIONS.secondsPerCard;
  const full = pages * tpp;
  const fullSec = pages * secPage;

  const tokensWithout = docs * full * reads;
  const writeCostTokens = docs * full;
  const tokensWith = writeCostTokens + docs * card * reads;
  const tokensSaved = tokensWithout - tokensWith;
  const usdWithout = (tokensWithout / 1_000_000) * price;
  const usdWith = (tokensWith / 1_000_000) * price;
  const usdSaved = usdWithout - usdWith;
  const hoursWithout = (docs * reads * fullSec) / 3600;
  const hoursWith = (docs * fullSec + docs * reads * secCard) / 3600;
  const hoursSaved = hoursWithout - hoursWith;
  const pctCheaper = tokensWithout === 0 ? 0 : (1 - tokensWith / tokensWithout) * 100;
  const tokenMultiple = tokensWith === 0 ? 0 : tokensWithout / tokensWith;

  return {
    tokensWithout,
    tokensWith,
    tokensSaved,
    usdWithout,
    usdWith,
    usdSaved,
    hoursWithout,
    hoursWith,
    hoursSaved,
    pctCheaper,
    tokenMultiple,
    breakEven: reads >= 2,
    writeCostTokens,
  };
}

export function formatUsd(n: number): string | null {
  if (Math.abs(n) < MONEY_FLOOR) return null;
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1000) return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (abs >= 10) return `${sign}$${abs.toFixed(0)}`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatHours(n: number): string {
  const abs = Math.abs(n);
  if (abs < 1 / 60) return `${Math.round(abs * 3600)} seconds`;
  if (abs < 1) return `${Math.round(abs * 60)} minutes`;
  if (abs < 10) return `${abs.toFixed(1)} hours`;
  return `${Math.round(abs).toLocaleString("en-US")} hours`;
}

export function formatMultiple(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${n.toFixed(n >= 10 ? 0 : 1)}×`;
}

export type DocVerdict = {
  multiple: number;
  pct: number;
  speedMultiple: number;
  usdPerRead: number;
  usdPer1000: number;
  hoursPer1000: number;
  moneyLine: string | null;
};

export function documentVerdict(
  fullTokens: number,
  cardTokens: number,
  fullSeconds: number,
  cardSeconds: number,
  usdPerMillion = ASSUMPTIONS.usdPerMillion,
): DocVerdict {
  const multiple = cardTokens > 0 ? fullTokens / cardTokens : 0;
  const pct = fullTokens > 0 ? (1 - cardTokens / fullTokens) * 100 : 0;
  const speedMultiple = cardSeconds > 0 ? fullSeconds / cardSeconds : 0;
  const usdPerRead = ((fullTokens - cardTokens) / 1_000_000) * usdPerMillion;
  const usdPer1000 = usdPerRead * 1000;
  const hoursPer1000 = ((fullSeconds - cardSeconds) * 1000) / 3600;
  const money = formatUsd(usdPer1000);
  return {
    multiple,
    pct,
    speedMultiple,
    usdPerRead,
    usdPer1000,
    hoursPer1000,
    moneyLine: money
      ? `per 1,000 reads of this file: ≈${money} and ≈${formatHours(hoursPer1000)} saved`
      : null,
  };
}

export function verdictPrimary(v: Pick<DocVerdict, "multiple" | "speedMultiple">): string {
  return `${formatMultiple(v.multiple)} fewer tokens · ${formatMultiple(v.speedMultiple)} faster on every future read`;
}
