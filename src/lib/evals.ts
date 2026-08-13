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

function numbersIn(s: string): string[] {
  return [...s.matchAll(/\d[\d,.]*%?/g)].map((m) => m[0].replace(/,/g, ""));
}

/** True if `hay` contains the numbers (or enough content words) from `needle`. */
export function pageSupports(hay: string, needle: string): boolean {
  if (!hay || !needle) return false;
  const text = hay.toLowerCase().replace(/,/g, "");
  const nums = numbersIn(needle);
  if (nums.length) return nums.some((n) => text.includes(n.toLowerCase()));
  const words = needle
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 4);
  if (!words.length) return text.includes(needle.toLowerCase().slice(0, 24));
  const hits = words.filter((w) => text.includes(w));
  return hits.length >= Math.min(2, words.length);
}

export function verifyExamItem(item: ExamItem, perPage: string[]): boolean {
  if (!item.question || !item.answer || item.page < 1) return false;
  return pageSupports(perPage[item.page - 1] || "", item.answer);
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
