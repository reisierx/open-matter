import { extractText as extractTextLite } from "pdf-frontmatter";

export type Extracted = {
  text: string;
  pages: number;
  perPage: string[];
  engine: "pdfjs" | "lite";
};

let workerReady = false;

async function extractWithPdfjs(bytes: Uint8Array): Promise<Extracted | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    if (!workerReady) {
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      workerReady = true;
    }
    const task = pdfjs.getDocument({ data: bytes.slice(), disableAutoFetch: true });
    const doc = await task.promise;
    const perPage: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean);
      perPage.push(strings.join(" ").replace(/[ \t]+\n/g, "\n").trimEnd());
    }
    const proxy = doc as { destroy?: () => Promise<void>; cleanup?: () => Promise<void> };
    await proxy.destroy?.();
    await proxy.cleanup?.();
    const text = perPage.join("\n\n").trim();
    return { text, pages: doc.numPages, perPage, engine: "pdfjs" };
  } catch {
    return null;
  }
}

/** Best-effort text extraction in the browser. Prefers PDF.js; falls back to the reference lite extractor. */
export async function extractPdfText(bytes: Uint8Array): Promise<Extracted> {
  const rich = await extractWithPdfjs(bytes);
  if (rich && rich.text.length > 40) return rich;
  const lite = await extractTextLite(bytes);
  if (rich && lite.text.length <= rich.text.length) return rich;
  return { ...lite, engine: "lite" };
}
