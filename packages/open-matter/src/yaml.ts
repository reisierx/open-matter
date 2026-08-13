import { parse, stringify, YAMLParseError } from "yaml";
import { ACCEPTED_SPEC_IDS, DOC_TYPES, SPEC_ID, type Manifest } from "./schema";

/** Parse YAML into a plain object. Throws a human-readable Error on failure. */
export function parseYaml(source: string): unknown {
  try {
    return parse(source, { uniqueKeys: false, maxAliasCount: 0 });
  } catch (err) {
    if (err instanceof YAMLParseError) {
      const line = err.linePos?.[0]?.line;
      const col = err.linePos?.[0]?.col;
      const where =
        line != null ? ` at line ${line}${col != null ? `, column ${col}` : ""}` : "";
      throw new Error(`This is not valid YAML${where}. ${plainYamlHint(err.message)}`);
    }
    throw new Error("This is not valid YAML. Check indentation and quotes.");
  }
}

function plainYamlHint(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("tab")) return "YAML wants spaces, not tabs.";
  if (m.includes("indent")) return "A line is indented more or less than its neighbours.";
  if (m.includes("map") || m.includes("block"))
    return "A key or list item is missing its value, or a colon is in the wrong place.";
  if (m.includes("alias") || m.includes("anchor"))
    return "This card does not allow YAML aliases.";
  return "Check that every key is followed by a colon and a value.";
}

export type Validation =
  | { ok: true; value: Manifest }
  | { ok: false; error: string };

function normalizeFact(raw: unknown): { fact: string; page: number } | null {
  if (typeof raw === "string") {
    const m = raw.match(/^(.*?)(?:\s*[(\uFF08]\s*(?:page|p\.?)\s*(\d+)\s*[)\uFF09]\s*)?$/i);
    const fact = (m?.[1] ?? raw).trim();
    if (!fact) return null;
    return { fact, page: m?.[2] ? Number(m[2]) : 0 };
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const fact = String(o.fact ?? o.text ?? o.value ?? "").trim();
    if (!fact) return null;
    const page = Number(o.page ?? o.p ?? 0);
    return { fact, page: Number.isFinite(page) ? page : 0 };
  }
  return null;
}

/**
 * Validate a parsed object as an open-matter/0.1 manifest.
 * Unknown keys are kept. Only `spec` and `title` are required.
 */
export function validateManifest(raw: unknown): Validation {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      error:
        "The card must be a YAML mapping — a list of keys and values — not a list or a single word.",
    };
  }

  // Drop prototype pollution keys; keep everything else.
  const src = raw as Record<string, unknown>;
  const value: Record<string, unknown> = Object.create(null);
  for (const [k, v] of Object.entries(src)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    value[k] = v;
  }

  if (!ACCEPTED_SPEC_IDS.includes(value.spec as (typeof ACCEPTED_SPEC_IDS)[number])) {
    return {
      ok: false,
      error: `The spec field must be "${SPEC_ID}" (or the legacy "pdf-frontmatter/0.1"). This reader only understands those versions.`,
    };
  }

  if (typeof value.title !== "string" || !value.title.trim()) {
    return {
      ok: false,
      error: "The card needs a title — a short name for the document.",
    };
  }

  if (value.doc_type != null && typeof value.doc_type === "string") {
    if (!(DOC_TYPES as readonly string[]).includes(value.doc_type)) {
      // Keep it (unknown keys spirit) — do not reject.
    }
  }

  if (value.pages != null && (typeof value.pages !== "number" || value.pages < 0)) {
    return { ok: false, error: "If present, pages must be a positive number." };
  }

  if (value.entities != null && !Array.isArray(value.entities)) {
    return { ok: false, error: "If present, entities must be a list of names or name/role maps." };
  }

  if (value.facts != null) {
    if (!Array.isArray(value.facts)) {
      return { ok: false, error: "If present, facts must be a list." };
    }
    value.facts = value.facts.map(normalizeFact).filter((f): f is NonNullable<typeof f> => f != null);
  }

  if (
    value.key_sections != null &&
    (typeof value.key_sections !== "object" || Array.isArray(value.key_sections))
  ) {
    return {
      ok: false,
      error: "If present, key_sections must be a mapping of snake_case names to page numbers.",
    };
  }

  return { ok: true, value: value as Manifest };
}

export function parseManifest(source: string): Validation {
  let raw: unknown;
  try {
    raw = parseYaml(source);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid YAML." };
  }
  return validateManifest(raw);
}

/** Serialise a manifest. Key order is preserved. */
export function stringifyManifest(manifest: Manifest): string {
  return stringify(manifest, {
    lineWidth: 88,
    minContentWidth: 0,
    singleQuote: false,
  }).trimEnd() + "\n";
}

/** Human-readable estimate: ~4 characters per token. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}
