#!/usr/bin/env node
/**
 * Tiny CLI: `pdf-frontmatter read file.pdf` / `pdf-frontmatter write file.pdf card.yaml -o out.pdf`
 */
import { readFile, writeFile } from "node:fs/promises";
import { readManifest, writeManifest, extractText } from "./index";

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (cmd === "read" && args[1]) {
    const bytes = new Uint8Array(await readFile(args[1]));
    const { text } = await extractText(bytes);
    const result = await readManifest(bytes, { extractedText: text });
    if (result.manifest) {
      process.stdout.write(result.yaml + (result.stale ? "\n# stale: content_sha256 mismatch\n" : ""));
      process.exit(result.stale ? 2 : 0);
    }
    console.error(result.reason);
    process.exit(1);
  }
  if (cmd === "write" && args[1] && args[2]) {
    const outFlag = args.indexOf("-o");
    const out = outFlag >= 0 ? args[outFlag + 1] : args[1].replace(/\.pdf$/i, "") + ".frontmatter.pdf";
    const pdf = new Uint8Array(await readFile(args[1]));
    const yaml = await readFile(args[2], "utf8");
    const next = await writeManifest(pdf, yaml);
    await writeFile(out, next);
    console.error(`wrote ${out} (${next.byteLength} bytes)`);
    return;
  }
  console.error(`pdf-frontmatter ${cmd ?? ""}

Usage:
  pdf-frontmatter read  <file.pdf>
  pdf-frontmatter write <file.pdf> <card.yaml> [-o out.pdf]
`);
  process.exit(cmd ? 1 : 0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
