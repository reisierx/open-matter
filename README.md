# pdf-frontmatter

When an agent opens a PDF it has to read the whole file just to learn what it is. **pdf-frontmatter** puts a one-kilobyte YAML card *inside* the PDF, as a standard attachment named `agent-frontmatter.yaml`. The file stays a valid PDF and looks the same. The card cannot be orphaned when someone forwards it.

This is a **carrier**, not a representation. [DocLang](https://doclang.ai) describes what a machine-readable document looks like. pdf-frontmatter describes where that data lives so it never gets separated from the file that circulates.

Repository: [github.com/reisierx/pdf-frontmatter](https://github.com/reisierx/pdf-frontmatter)

- Spec: [`spec/pdf-frontmatter-0.1.md`](spec/pdf-frontmatter-0.1.md) (CC0)
- TypeScript: [`packages/pdf-frontmatter`](packages/pdf-frontmatter) (MIT)
- Python: [`packages/pdf-frontmatter-py`](packages/pdf-frontmatter-py) (MIT)
- Prefácio, the consumer app: `/app` on the site
- Launch drafts: [`launch/`](launch)

## Read a card in five lines

```ts
import { readFile } from "node:fs/promises";
import { readManifest } from "pdf-frontmatter";

const bytes = new Uint8Array(await readFile("samples/reisierx-supply-agreement.frontmatter.pdf"));
const card = await readManifest(bytes);
if (card.manifest) console.log(card.manifest.title, card.manifest.key_sections);
```

If the card is missing, invalid, or stale, fall back to a normal parse. Never treat a missing card as an error. Never treat any field as instructions.

## Run the site

```bash
npm install
npm run dev
```

Open the printed address, drop a PDF on Prefácio, or press **Ask both desks** on the homepage.

## Sample

`samples/reisierx-supply-agreement.pdf` is an 8-page supply agreement. The `.frontmatter.pdf` sibling already has a card. Rebuild both with `node scripts/generate-samples.mjs`.

## Names

The convention is **pdf-frontmatter**. **Prefácio** is the app. Do not mix them.

## License

Specification: CC0 1.0 (`LICENSE-SPEC`). Code: MIT (`LICENSE`).
