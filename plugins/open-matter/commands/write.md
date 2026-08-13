---
description: Write an open-matter card into a PDF and evaluate it against the pages.
---

Write a card for $ARGUMENTS (a PDF path, or the file the user just mentioned).

1. Extract the page text.
2. Follow the **open-matter-pdf-write** skill. Cited facts only.
3. Run an evaluation written from the pages, not from the card. If it fails, add cites and retry once.
4. If `write_manifest` is available, attach the card. Otherwise tell the user to download from open-matter.org/app or run the library.

Do not change the visible pages. Do not ship a card that failed evaluation.
