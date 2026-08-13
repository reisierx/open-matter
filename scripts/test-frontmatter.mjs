import { readFile } from "node:fs/promises";
import { PDFDocument, PDFArray, PDFDict, PDFName, PDFHexString, PDFString, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { parse as parseYaml } from "yaml";

function asString(obj) {
  if (obj instanceof PDFHexString || obj instanceof PDFString) return obj.decodeText();
  return null;
}

function readCard(pdf) {
  const names = pdf.catalog.lookup(PDFName.of("Names"));
  if (!(names instanceof PDFDict)) return null;
  const embedded = names.lookup(PDFName.of("EmbeddedFiles"));
  if (!(embedded instanceof PDFDict)) return null;
  const list = embedded.lookup(PDFName.of("Names"));
  if (!(list instanceof PDFArray)) return null;
  for (let i = 0; i + 1 < list.size(); i += 2) {
    if (asString(list.get(i)) !== "open-matter.yaml") continue;
    const spec = list.lookup(i + 1);
    if (!(spec instanceof PDFDict)) continue;
    const ef = spec.lookup(PDFName.of("EF"));
    const stream = ef instanceof PDFDict ? ef.lookup(PDFName.of("F")) : null;
    if (!(stream instanceof PDFRawStream)) continue;
    return new TextDecoder().decode(decodePDFRawStream(stream).decode());
  }
  return null;
}

const path = new URL("../samples/reisierx-supply-agreement.frontmatter.pdf", import.meta.url);
const bytes = await readFile(path);
const pdf = await PDFDocument.load(bytes);
const yaml = readCard(pdf);
if (!yaml) throw new Error("missing card on sample");
const card = parseYaml(yaml);
if (card.spec !== "open-matter/0.1") throw new Error("bad spec");
if (!card.title) throw new Error("missing title");
if (card.key_sections.liability_cap !== 4) throw new Error("wrong liability page");

const plain = await readFile(new URL("../samples/reisierx-supply-agreement.pdf", import.meta.url));
const naked = await PDFDocument.load(plain);
if (readCard(naked)) throw new Error("plain sample should have no card");

console.log("ok — sample card reads back");
console.log(card.title);
