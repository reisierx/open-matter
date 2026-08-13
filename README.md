# open-matter

**Stop making AI re-read the same PDF.**

Formerly *pdf-frontmatter*. Same convention, name that can grow past PDF.

A 1 KB YAML card named `open-matter.yaml` lives *inside* the file as a
standard attachment. PDF is the first profile. Tools that look for the card
skip the parse. Tools that don’t still get a normal file.

Site: [open-matter.org](https://open-matter.org)

- Spec: [`spec/open-matter-0.1.md`](spec/open-matter-0.1.md) (CC0)
- TypeScript: [`packages/open-matter`](packages/open-matter) (MIT)
- Python: [`packages/open-matter-py`](packages/open-matter-py) (MIT)
- App: [/app](https://open-matter.org/app)
- Why: [/why](https://open-matter.org/why)

## Names

There is one name: **open-matter**. The app is the standard’s front door.
`pdf-frontmatter` and `agent-frontmatter.yaml` are still accepted on read.

## Read a card in five lines

```ts
import { readFile } from "node:fs/promises";
import { readManifest } from "open-matter";

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

## License

Specification: CC0 1.0 (`LICENSE-SPEC`). Code: MIT (`LICENSE`).
