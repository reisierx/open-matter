import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFString,
  decodePDFRawStream,
  type PDFObject,
} from "pdf-lib";

function asString(obj: PDFObject | undefined): string | null {
  if (!obj) return null;
  if (obj instanceof PDFHexString || obj instanceof PDFString) {
    try {
      return obj.decodeText();
    } catch {
      return obj.toString();
    }
  }
  const raw = obj.toString();
  return raw.replace(/^\(|\)$/g, "");
}

function decodeStream(obj: PDFObject | undefined): Uint8Array | null {
  if (!obj) return null;
  if (obj instanceof PDFRawStream) {
    try {
      return decodePDFRawStream(obj).decode();
    } catch {
      return obj.getContents();
    }
  }
  return null;
}

function filespecBytes(spec: PDFDict): Uint8Array | null {
  const ef = spec.lookup(PDFName.of("EF"));
  if (!(ef instanceof PDFDict)) return null;
  return (
    decodeStream(ef.lookup(PDFName.of("F"))) ??
    decodeStream(ef.lookup(PDFName.of("UF"))) ??
    decodeStream(ef.lookup(PDFName.of("Unix"))) ??
    decodeStream(ef.lookup(PDFName.of("DOS"))) ??
    decodeStream(ef.lookup(PDFName.of("Mac")))
  );
}

function filespecName(spec: PDFDict): string | null {
  return (
    asString(spec.lookup(PDFName.of("UF"))) ??
    asString(spec.lookup(PDFName.of("F")))
  );
}

function walkNameTree(
  node: PDFDict,
  visit: (name: string, spec: PDFDict) => void,
): void {
  const names = node.lookup(PDFName.of("Names"));
  if (names instanceof PDFArray) {
    for (let i = 0; i + 1 < names.size(); i += 2) {
      const key = asString(names.get(i));
      const spec = names.lookup(i + 1);
      if (key && spec instanceof PDFDict) visit(key, spec);
    }
  }
  const kids = node.lookup(PDFName.of("Kids"));
  if (kids instanceof PDFArray) {
    for (let i = 0; i < kids.size(); i++) {
      const kid = kids.lookup(i);
      if (kid instanceof PDFDict) walkNameTree(kid, visit);
    }
  }
}

export type EmbeddedFile = {
  name: string;
  bytes: Uint8Array;
  mimeType: string | null;
};

/** Read every file in the EmbeddedFiles name tree. */
export function listEmbeddedFiles(pdfDoc: PDFDocument): EmbeddedFile[] {
  const names = pdfDoc.catalog.lookup(PDFName.of("Names"));
  if (!(names instanceof PDFDict)) return [];
  const embedded = names.lookup(PDFName.of("EmbeddedFiles"));
  if (!(embedded instanceof PDFDict)) return [];

  const out: EmbeddedFile[] = [];
  walkNameTree(embedded, (name, spec) => {
    const bytes = filespecBytes(spec);
    if (!bytes) return;
    const ef = spec.lookup(PDFName.of("EF"));
    let mime: string | null = null;
    if (ef instanceof PDFDict) {
      const stream = ef.lookup(PDFName.of("F"));
      if (stream instanceof PDFRawStream) {
        const subtype = stream.dict.lookup(PDFName.of("Subtype"));
        if (subtype instanceof PDFName) mime = subtype.decodeText();
        else if (subtype) mime = asString(subtype);
      }
    }
    out.push({ name, bytes, mimeType: mime });
  });
  return out;
}

function rebuildNamesArray(
  pdfDoc: PDFDocument,
  node: PDFDict,
  keep: (name: string, spec: PDFDict) => boolean,
): PDFDict[] {
  const removed: PDFDict[] = [];
  const names = node.lookup(PDFName.of("Names"));
  if (names instanceof PDFArray) {
    const next = pdfDoc.context.obj([]);
    for (let i = 0; i + 1 < names.size(); i += 2) {
      const keyObj = names.get(i);
      const spec = names.lookup(i + 1);
      const key = asString(keyObj);
      if (key && spec instanceof PDFDict && !keep(key, spec)) {
        removed.push(spec);
        continue;
      }
      next.push(keyObj);
      next.push(names.get(i + 1));
    }
    node.set(PDFName.of("Names"), next);
  }
  const kids = node.lookup(PDFName.of("Kids"));
  if (kids instanceof PDFArray) {
    for (let i = 0; i < kids.size(); i++) {
      const kid = kids.lookup(i);
      if (kid instanceof PDFDict) removed.push(...rebuildNamesArray(pdfDoc, kid, keep));
    }
  }
  return removed;
}

/** Remove attachments whose filename matches `filename`. */
export function removeEmbeddedFile(pdfDoc: PDFDocument, filename: string): void {
  const names = pdfDoc.catalog.lookup(PDFName.of("Names"));
  if (!(names instanceof PDFDict)) return;
  const embedded = names.lookup(PDFName.of("EmbeddedFiles"));
  if (!(embedded instanceof PDFDict)) return;

  const removed = rebuildNamesArray(
    pdfDoc,
    embedded,
    (name) => name !== filename,
  );
  if (removed.length === 0) return;

  const af = pdfDoc.catalog.lookup(PDFName.of("AF"));
  if (af instanceof PDFArray) {
    const next = pdfDoc.context.obj([]);
    for (let i = 0; i < af.size(); i++) {
      const spec = af.lookup(i);
      if (spec instanceof PDFDict) {
        const n = filespecName(spec);
        if (n === filename) continue;
      }
      next.push(af.get(i));
    }
    pdfDoc.catalog.set(PDFName.of("AF"), next);
  }
}
