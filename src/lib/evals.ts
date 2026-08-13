import { citedFacts, type Manifest } from "open-matter";

export type ExamItem = {
  question: string;
  answer: string;
  page: number;
};

export type Check = {
  id: string;
  ok: boolean;
  label: string;
};

export type QuestionResult = {
  question: string;
  gold: string;
  page: number;
  answer: string;
  ok: boolean;
};

export type EvalResult = {
  structural: Check[];
  questions: QuestionResult[];
  passed: boolean;
  tokens: number;
  ms: number;
};

function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function numberTokens(s: string): string[] {
  const out = new Set<string>();
  for (const m of s.matchAll(/\d[\d.,]*/g)) {
    const raw = m[0].replace(/[.,]/g, "");
    if (raw.length < 2) continue;
    out.add(raw);
    out.add(raw.replace(/^0+/, "") || "0");
  }
  const compact = s.replace(/\D/g, "");
  if (compact.length >= 6) out.add(compact);
  return [...out];
}

function hayHasNumber(hay: string, n: string): boolean {
  if (!n) return false;
  if (hay.includes(n)) return true;
  const digits = hay.replace(/\D/g, "");
  return digits.includes(n);
}

/** True if `hay` contains the numbers (or enough content words) from `needle`. */
export function pageSupports(hay: string, needle: string): boolean {
  if (!hay || !needle) return false;
  const text = fold(hay).replace(/,/g, "");
  const nums = numberTokens(needle);
  if (nums.length) return nums.some((n) => hayHasNumber(text, n.toLowerCase()));
  const words = fold(needle)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 4);
  if (!words.length) return text.includes(fold(needle).slice(0, 24));
  const hits = words.filter((w) => text.includes(w));
  return hits.length >= Math.min(2, words.length);
}

export function verifyExamItem(item: ExamItem, perPage: string[]): boolean {
  if (!item.question || !item.answer || item.page < 1) return false;
  return pageSupports(perPage[item.page - 1] || "", item.answer);
}

/**
 * Close the rebuild loop without inventing: retarget a numbered fact to the
 * page that actually contains its numbers, or drop it if no page does.
 */
export function repairCites(manifest: Manifest, perPage: string[]): Manifest {
  const facts = citedFacts(manifest);
  if (!facts.length) return manifest;
  const next = facts
    .map((f) => {
      if (!/\d/.test(f.fact)) return f;
      if (f.page > 0 && pageSupports(perPage[f.page - 1] || "", f.fact)) return f;
      const found = perPage.findIndex((p) => pageSupports(p, f.fact));
      if (found >= 0) return { ...f, page: found + 1 };
      return null;
    })
    .filter((f): f is { fact: string; page: number } => Boolean(f));
  return { ...manifest, facts: next };
}

export function structuralChecks(manifest: Manifest, perPage: string[]): Check[] {
  const checks: Check[] = [];
  const facts = citedFacts(manifest);
  if (!facts.length) {
    checks.push({ id: "facts", ok: false, label: "The card has no cited facts." });
    return checks;
  }
  for (const [i, f] of facts.entries()) {
    const numbered = /\d/.test(f.fact);
    if (numbered && !(f.page > 0)) {
      checks.push({ id: `cite-${i}`, ok: false, label: `Number without a page: ${clip(f.fact)}` });
      continue;
    }
    if (!(f.page > 0)) continue;
    const pageText = perPage[f.page - 1] || "";
    if (!pageText.trim()) {
      checks.push({
        id: `empty-${i}`,
        ok: false,
        label: `Page ${f.page} has no extractable text for ${clip(f.fact)}`,
      });
      continue;
    }
    if (numbered) {
      const ok = pageSupports(pageText, f.fact);
      checks.push({
        id: `ground-${i}`,
        ok,
        label: ok
          ? `p.${f.page} contains ${clip(f.fact)}`
          : `p.${f.page} does not contain ${clip(f.fact)}`,
      });
    }
  }
  return checks;
}

export function answerMatchesGold(modelAnswer: string, gold: string): boolean {
  return pageSupports(modelAnswer, gold) || pageSupports(gold, modelAnswer);
}

export function scoreEval(structural: Check[], questions: QuestionResult[], tokens: number, ms: number): EvalResult {
  const structOk = structural.length > 0 && structural.every((c) => c.ok);
  const need = questions.length ? Math.ceil(questions.length * 0.75) : 0;
  const qOk = questions.filter((q) => q.ok).length;
  const passed = structOk && (questions.length === 0 ? false : qOk >= need);
  return { structural, questions, passed, tokens, ms };
}

function clip(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 72 ? `${t.slice(0, 70)}…` : t;
}
