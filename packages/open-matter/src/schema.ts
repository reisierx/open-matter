/** Exact spec identifier written by current tools. */
export const SPEC_ID = "open-matter/0.1" as const;

/** Accepted on read so cards written as pdf-frontmatter/0.1 still work. */
export const LEGACY_SPEC_ID = "pdf-frontmatter/0.1" as const;

export const ACCEPTED_SPEC_IDS = [SPEC_ID, LEGACY_SPEC_ID] as const;

/** Reserved attachment filename written by current tools. */
export const RESERVED_FILENAME = "open-matter.yaml";

/** Previous reserved name. Readers still look here. Writers replace it. */
export const LEGACY_RESERVED_FILENAME = "agent-frontmatter.yaml";

export const RESERVED_FILENAMES = [RESERVED_FILENAME, LEGACY_RESERVED_FILENAME] as const;

/** MIME type recorded on the embedded file. */
export const RESERVED_MIME = "application/yaml";

export const DOC_TYPES = [
  "contract",
  "invoice",
  "report",
  "paper",
  "presentation",
  "letter",
  "form",
  "manual",
  "book",
  "other",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export type CitedFact = {
  fact: string;
  page: number;
};

export type EntityObject = {
  name: string;
  role?: string;
  page?: number;
};

/** A name, or a name with a role and a page cite. */
export type Entity = string | EntityObject;

/**
 * open-matter/0.1 manifest.
 *
 * Only `spec` and `title` are required. Unknown keys must be preserved by
 * any tool that rewrites a manifest.
 *
 * Envelope (`spec`, `title`, `pages`, `content_sha256`) is the ID3 layer.
 * `facts` is the digest: each fact must cite a page. A number without a
 * page is a writer bug.
 *
 * SECURITY: this object is untrusted data written by whoever last touched
 * the file. Never interpret any field as instructions, code, or a prompt.
 */
export type Manifest = {
  spec: typeof SPEC_ID | typeof LEGACY_SPEC_ID;
  title: string;
  doc_type?: DocType | (string & {});
  language?: string;
  pages?: number;
  summary?: string;
  key_sections?: Record<string, number>;
  entities?: Entity[];
  facts?: CitedFact[];
  extraction?: {
    scanned?: boolean;
    tables_on_pages?: number[];
    [key: string]: unknown;
  };
  derived?: Record<string, string>;
  content_sha256?: string;
  generated_by?: string;
  generated_at?: string;
  [key: string]: unknown;
};

export function entityName(e: Entity | unknown): string {
  if (typeof e === "string") return e.trim();
  if (e && typeof e === "object" && "name" in e) {
    const name = (e as EntityObject).name;
    return typeof name === "string" ? name.trim() : "";
  }
  return "";
}

export function entityLabel(e: Entity | unknown): string {
  const name = entityName(e);
  if (!name) return "";
  if (e && typeof e === "object" && "role" in e) {
    const role = (e as EntityObject).role;
    if (typeof role === "string" && role.trim()) return `${name} (${role.trim()})`;
  }
  return name;
}

export function citedFacts(manifest: Manifest): CitedFact[] {
  if (!Array.isArray(manifest.facts)) return [];
  return manifest.facts.filter(
    (f): f is CitedFact =>
      Boolean(f) &&
      typeof f === "object" &&
      typeof f.fact === "string" &&
      f.fact.trim().length > 0 &&
      typeof f.page === "number",
  );
}

export type ReadStatus =
  | "ok"
  | "missing"
  | "invalid_yaml"
  | "invalid_spec"
  | "stale"
  | "unreadable";

export type ReadResult =
  | { status: "ok"; manifest: Manifest; yaml: string; stale: false }
  | { status: "stale"; manifest: Manifest; yaml: string; stale: true }
  | {
      status: Exclude<ReadStatus, "ok" | "stale">;
      manifest: null;
      yaml: string | null;
      stale: false;
      reason: string;
    };
