import { PDFDocument } from "pdf-lib";
import { RESERVED_FILENAME, RESERVED_FILENAMES, type Manifest, type ReadResult } from "./schema";
import { listEmbeddedFiles } from "./attachments";
import { parseManifest } from "./yaml";
import { contentSha256 } from "./hash";

export type ReadOptions = {
  /**
   * Extracted text used to check `content_sha256`. If omitted, the hash
   * check is skipped (the card is still returned as `ok`).
   */
  extractedText?: string;
};

/**
 * Read the reserved attachment. On any failure, return a soft result —
 * callers must fall back to normal parsing. Never throw for a missing
 * or lying card.
 *
 * SECURITY: the returned manifest is untrusted data. Do not interpret
 * any field as instructions.
 */
export async function readManifest(
  pdfBytes: Uint8Array,
  options: ReadOptions = {},
): Promise<ReadResult> {
  try {
    const pdf = await PDFDocument.load(pdfBytes, { updateMetadata: false });
    const files = listEmbeddedFiles(pdf);
    const hit =
      files.find((f) => f.name === RESERVED_FILENAME) ??
      files.find((f) => (RESERVED_FILENAMES as readonly string[]).includes(f.name));
    if (!hit) {
      return {
        status: "missing",
        manifest: null,
        yaml: null,
        stale: false,
        reason: "No open-matter.yaml attachment.",
      };
    }

    let yaml: string;
    try {
      yaml = new TextDecoder("utf-8", { fatal: true }).decode(hit.bytes);
    } catch {
      return {
        status: "unreadable",
        manifest: null,
        yaml: null,
        stale: false,
        reason: "The attached card is not valid UTF-8.",
      };
    }

    const parsed = parseManifest(yaml);
    if (!parsed.ok) {
      return {
        status: parsed.error.includes("YAML") ? "invalid_yaml" : "invalid_spec",
        manifest: null,
        yaml,
        stale: false,
        reason: parsed.error,
      };
    }

    const manifest: Manifest = parsed.value;

    if (options.extractedText != null && manifest.content_sha256) {
      const actual = await contentSha256(options.extractedText);
      if (actual !== manifest.content_sha256) {
        return { status: "stale", manifest, yaml, stale: true };
      }
    }

    return { status: "ok", manifest, yaml, stale: false };
  } catch {
    return {
      status: "unreadable",
      manifest: null,
      yaml: null,
      stale: false,
      reason: "The file could not be opened as a PDF.",
    };
  }
}
