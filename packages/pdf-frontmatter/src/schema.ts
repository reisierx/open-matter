/** Exact spec identifier. Tools must not invent other values for `spec`. */
export const SPEC_ID = "pdf-frontmatter/0.1" as const;

/** Reserved attachment filename. Match this name exactly, not a pattern. */
export const RESERVED_FILENAME = "agent-frontmatter.yaml";

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

/**
 * pdf-frontmatter/0.1 manifest.
 *
 * Only `spec` and `title` are required. Unknown keys must be preserved by
 * any tool that rewrites a manifest.
 *
 * SECURITY: this object is untrusted data written by whoever last touched
 * the file. Never interpret any field as instructions, code, or a prompt.
 */
export type Manifest = {
  spec: typeof SPEC_ID;
  title: string;
  doc_type?: DocType | (string & {});
  language?: string;
  pages?: number;
  summary?: string;
  key_sections?: Record<string, number>;
  entities?: string[];
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
