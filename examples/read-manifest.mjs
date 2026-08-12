/**
 * Read the card from the sample enriched PDF.
 *   node examples/read-manifest.mjs
 */
import { readFile } from "node:fs/promises";
import { PDFDocument, PDFArray, PDFDict, PDFName, PDFHexString, PDFString, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { parse as parseYaml } from "yaml";

function asString(obj) {
  if (obj instanceof PDFHexString || obj instanceof PDFString) return obj.decodeText();
  return null;
}

const bytes = await readFile(new URL("../samples/reisierx-supply-agreement.frontmatter.pdf", import.meta.url));
const pdf = await PDFDocument.load(bytes);
const names = pdf.catalog.lookup(PDFName.of("Names"));
const embedded = names?.lookup?.(PDFName.of("EmbeddedFiles"));
const list = embedded?.lookup?.(PDFName.of("Names"));
if (!(list instanceof PDFArray)) {
  console.error("No EmbeddedFiles name tree.");
  process.exit(1);
}
for (let i = 0; i + 1 < list.size(); i += 2) {
  const filename = asString(list.get(i));
  if (filename !== "agent-frontmatter.yaml") continue;
  const spec = list.lookup(i + 1);
  if (!(spec instanceof PDFDict)) continue;
  const ef = spec.lookup(PDFName.of("EF"));
  const stream = ef instanceof PDFDict ? ef.lookup(PDFName.of("F")) : null;
  if (!(stream instanceof PDFRawStream)) continue;
  const yaml = new TextDecoder().decode(decodePDFRawStream(stream).decode());
  const card = parseYaml(yaml);
  console.log(yaml);
  console.log("# title:", card.title);
  console.log("# liability_cap page:", card.key_sections?.liability_cap);
  process.exit(0);
}
console.error("agent-frontmatter.yaml not found");
process.exit(1);
