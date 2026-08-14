# open-matter

**Stop making AI re-read the same PDF.**

The card is written on a read you were already doing. It stays inside the
file as `open-matter.yaml`. The next model skips the parse. Tools that do
not look still get a normal file.

Site: [open-matter.org](https://open-matter.org)

- Spec: [`spec/open-matter-0.1.md`](spec/open-matter-0.1.md) (CC0)
- TypeScript: [`packages/open-matter`](packages/open-matter) (MIT)
- Python: [`packages/open-matter-py`](packages/open-matter-py) (MIT)
- Claude plugin: [`plugins/open-matter`](plugins/open-matter)
- App: [/app](https://open-matter.org/app)

## Install (Claude)

```
/plugin marketplace add reisierx/open-matter
/plugin install open-matter@open-matter
```

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

Libraries are in this repo. They are not on npm/PyPI yet.

## License

Specification: CC0 1.0 (`LICENSE-SPEC`). Code: MIT (`LICENSE`).
