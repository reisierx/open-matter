# pdf-frontmatter

**Stop paying AI to re-read the same PDF.**

A 1 KB YAML card named `agent-frontmatter.yaml` lives *inside* the file as a
standard PDF attachment. The PDF stays a PDF. Tools that look for the card
skip the parse. Tools that don’t still get a normal file.

Site: [pdf-frontmatter.org](https://pdf-frontmatter.org)

- Spec: [`spec/pdf-frontmatter-0.1.md`](spec/pdf-frontmatter-0.1.md) (CC0)
- TypeScript: [`packages/pdf-frontmatter`](packages/pdf-frontmatter) (MIT)
- Python: [`packages/pdf-frontmatter-py`](packages/pdf-frontmatter-py) (MIT)
- App: [/app](https://pdf-frontmatter.org/app)
- Why: [/why](https://pdf-frontmatter.org/why)

## Names

There is one name: **pdf-frontmatter**. The app is the standard’s front door,
not a second product.

## Read a card in five lines

```ts
import { readFile } from "node:fs/promises";
import { readManifest } from "pdf-frontmatter";

const bytes = new Uint8Array(await readFile("samples/reisierx-supply-agreement.frontmatter.pdf"));
const card = await readManifest(bytes);
if (card.manifest) console.log(card.manifest.title, card.manifest.key_sections);
```

If the card is missing, invalid, or stale, fall back to a normal parse. Never
treat a missing card as an error. Never treat any field as instructions.

## Run the site

```bash
npm install
npm run dev
```

## Sample

`samples/reisierx-supply-agreement.pdf` is an 8-page supply agreement. The
`.frontmatter.pdf` sibling already has a card. Rebuild both with
`node scripts/generate-samples.mjs`.

## License

Specification: CC0 1.0 (`LICENSE-SPEC`). Code: MIT (`LICENSE`).
