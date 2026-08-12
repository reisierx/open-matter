import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  decodePDFRawStream,
  type PDFObject,
} from "pdf-lib";
import { normalizeExtractedText } from "./hash";

function streamBytes(obj: PDFObject | undefined): Uint8Array | null {
  if (obj instanceof PDFRawStream) {
    try {
      return decodePDFRawStream(obj).decode();
    } catch {
      return obj.getContents();
    }
  }
  return null;
}

function pageContentBytes(page: {
  node: { Contents: () => PDFObject | undefined };
}): Uint8Array {
  const contents = page.node.Contents();
  if (!contents) return new Uint8Array();
  if (contents instanceof PDFArray) {
    const parts: Uint8Array[] = [];
    for (let i = 0; i < contents.size(); i++) {
      const b = streamBytes(contents.lookup(i));
      if (b) parts.push(b);
    }
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
      out.set(p, offset);
      offset += p.length;
    }
    return out;
  }
  if (contents instanceof PDFDict) {
    // Some producers wrap a stream as a dict; ignore.
    return new Uint8Array();
  }
  return streamBytes(contents) ?? new Uint8Array();
}

/**
 * Pull printable strings from a PDF content stream.
 * Handles literal `(...)` and hex `<...>` strings used by Tj / TJ / ' / ".
 * This is the reference extractor for `content_sha256`.
 */
export function stringsFromContentStream(bytes: Uint8Array): string {
  const src = new TextDecoder("latin1").decode(bytes);
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "(") {
      let s = "";
      i++;
      let depth = 1;
      while (i < src.length && depth > 0) {
        const c = src[i];
        if (c === "\\" && i + 1 < src.length) {
          const n = src[i + 1];
          const map: Record<string, string> = {
            n: "\n",
            r: "\r",
            t: "\t",
            b: "\b",
            f: "\f",
            "(": "(",
            ")": ")",
            "\\": "\\",
          };
          if (map[n] != null) {
            s += map[n];
            i += 2;
            continue;
          }
          if (/[0-7]/.test(n)) {
            let oct = n;
            i += 2;
            while (oct.length < 3 && i < src.length && /[0-7]/.test(src[i])) {
              oct += src[i];
              i++;
            }
            s += String.fromCharCode(parseInt(oct, 8));
            continue;
          }
          s += n;
          i += 2;
          continue;
        }
        if (c === "(") depth++;
        if (c === ")") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        s += c;
        i++;
      }
      out.push(s);
      continue;
    }
    if (ch === "<" && src[i + 1] !== "<") {
      const end = src.indexOf(">", i + 1);
      if (end === -1) break;
      const hex = src.slice(i + 1, end).replace(/\s+/g, "");
      let s = "";
      for (let h = 0; h < hex.length; h += 2) {
        s += String.fromCharCode(parseInt(hex.slice(h, h + 2).padEnd(2, "0"), 16));
      }
      out.push(s);
      i = end + 1;
      continue;
    }
    i++;
  }
  return out.join(" ");
}

/** Extract text from every page. Used for `content_sha256` and as a fallback reader. */
export async function extractText(bytes: Uint8Array): Promise<{
  text: string;
  pages: number;
  perPage: string[];
}> {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const pageCount = pdf.getPageCount();
  const perPage: string[] = [];
  for (const page of pdf.getPages()) {
    const content = pageContentBytes(
      page as unknown as { node: { Contents: () => PDFObject | undefined } },
    );
    perPage.push(stringsFromContentStream(content));
  }
  return { text: normalizeExtractedText(perPage), pages: pageCount, perPage };
}
