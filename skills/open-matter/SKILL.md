---
name: open-matter
description: The open-matter convention — a cited digest that travels inside a file. Format-agnostic. Use when deciding what a card must contain, not how a specific format stores it.
---

# The convention (any format)

The card is not “PDF frontmatter.” It is a portable digest.

## Envelope

`spec`, `title`, `pages`, `content_sha256`. Find it. Know if it is stale.

## Digest

`facts: [{fact, page}]`, typed `entities`, `key_sections`. A number without a page is a writer bug.

## Two skills per format

Mechanics differ. The envelope does not.

- `open-matter-pdf-write` / `open-matter-pdf-read` — ships now (PDF EmbeddedFiles).
- Later: `open-matter-docx-*`, `open-matter-epub-*`, `open-matter-html-*`.

Evals are written from the **pages** (or equivalent), never from the card. See `skills/evals`.
