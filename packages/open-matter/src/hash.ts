/** First 16 hex characters of SHA-256 over UTF-8 `text`. */
export async function contentSha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return hex.slice(0, 16);
}

export function normalizeExtractedText(pages: string[]): string {
  return pages
    .map((p) => p.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trimEnd())
    .join("\n\n")
    .trim();
}
