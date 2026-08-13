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

/**
 * open-matter/0.1 manifest.
 *
 * Only `spec` and `title` are required. Unknown keys must be preserved by
 * any tool that rewrites a manifest.
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
