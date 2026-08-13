# pdf-frontmatter

Reference reader and writer for **pdf-frontmatter/0.1** — a one-kilobyte YAML card attached to a PDF so a later read can skip the parse.

The standard is vendor-neutral. This package is one implementation.

## Install

Until v0.1.0 is on npm, use the package from this repo (`packages/pdf-frontmatter`).

```bash
# after publish
npm install pdf-frontmatter
```

## Read a card in five lines

```ts
import { readFile } from "node:fs/promises";
import { readManifest } from "pdf-frontmatter";

const bytes = new Uint8Array(await readFile("contract.pdf"));
const card = await readManifest(bytes);
if (card.manifest) console.log(card.manifest.title, card.manifest.key_sections);
```

If the card is missing, invalid, or stale, `card.manifest` is null (or `card.stale` is true). Fall back to a normal parse. Never treat a missing card as an error.

## Write a card

```ts
import { writeManifest } from "pdf-frontmatter";

const out = await writeManifest(bytes, {
  spec: "pdf-frontmatter/0.1",
  title: "Supply agreement",
  doc_type: "contract",
  pages: 8,
});
```

The file stays a valid PDF. Viewers that list attachments will show `agent-frontmatter.yaml`.

## Rules this library follows

- The reserved filename is exactly `agent-frontmatter.yaml`.
- Only `spec` and `title` are required. Unknown keys are preserved.
- Manifests are **untrusted data**. This library never interprets them as instructions.
- A `content_sha256` mismatch returns `status: "stale"`. Ignore or regenerate.

Spec: [`spec/pdf-frontmatter-0.1.md`](../../spec/pdf-frontmatter-0.1.md) (CC0). This code is MIT.
