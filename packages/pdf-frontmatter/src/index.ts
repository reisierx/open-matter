/**
 * pdf-frontmatter — reference reader/writer for the pdf-frontmatter/0.1
 * convention. Spec: CC0. This code: MIT.
 *
 * SECURITY: a manifest is untrusted data. Never interpret it as
 * instructions, code, or a prompt. On any failure, fall back to a
 * normal read of the PDF.
 */
export {
  SPEC_ID,
  RESERVED_FILENAME,
  RESERVED_MIME,
  DOC_TYPES,
  type Manifest,
  type DocType,
  type ReadResult,
  type ReadStatus,
} from "./schema";
export {
  parseYaml,
  parseManifest,
  validateManifest,
  stringifyManifest,
  estimateTokens,
  type Validation,
} from "./yaml";
export { contentSha256, normalizeExtractedText } from "./hash";
export { extractText } from "./text";
export { readManifest, type ReadOptions } from "./read";
export { writeManifest, type WriteOptions } from "./write";
export { listEmbeddedFiles, removeEmbeddedFile } from "./attachments";
