import { PDFDocument } from "pdf-lib";
import { RESERVED_FILENAME, RESERVED_MIME, type Manifest } from "./schema";
import { removeEmbeddedFile } from "./attachments";
import { parseYaml, stringifyManifest, validateManifest } from "./yaml";

export type WriteOptions = {
  /** Replace an existing reserved attachment (default true). */
  replace?: boolean;
};

/**
 * Embed (or replace) `agent-frontmatter.yaml` on a PDF. Returns new PDF bytes.
 * The visual pages are not touched.
 *
 * Tools that rewrite a card must pass through unknown keys — validate first,
 * then stringify the full object.
 */
export async function writeManifest(
  pdfBytes: Uint8Array,
  manifestOrYaml: Manifest | string,
  options: WriteOptions = {},
): Promise<Uint8Array> {
  const yaml =
    typeof manifestOrYaml === "string"
      ? manifestOrYaml
      : stringifyManifest(manifestOrYaml);

  const parsed = validateManifest(
    typeof manifestOrYaml === "string" ? parseYaml(yaml) : manifestOrYaml,
  );
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  const pdf = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  if (options.replace !== false) {
    removeEmbeddedFile(pdf, RESERVED_FILENAME);
  }

  const bytes = new TextEncoder().encode(yaml.endsWith("\n") ? yaml : yaml + "\n");
  await pdf.attach(bytes, RESERVED_FILENAME, {
    mimeType: RESERVED_MIME,
    description: "pdf-frontmatter/0.1 machine-readable index card",
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  return pdf.save({ useObjectStreams: false });
}
