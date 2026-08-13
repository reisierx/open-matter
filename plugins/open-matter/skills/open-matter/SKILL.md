---
name: open-matter
description: The open-matter convention — a cited digest that travels inside a file. Use when deciding what a card must contain.
---

# The convention (any format)

The card is a portable digest, not “PDF frontmatter.”

## Envelope

`spec`, `title`, `pages`, `content_sha256`. Find it. Know if it is stale.

## Digest

`facts: [{fact, page}]`, typed `entities`, `key_sections`. A number without a page is a writer bug.

PDF profile ships now (`open-matter-pdf-write` / `open-matter-pdf-read`). Evaluation is written from the pages, never from the card.
