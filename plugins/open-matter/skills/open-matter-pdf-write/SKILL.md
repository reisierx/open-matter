---
name: open-matter-pdf-write
description: Write an open-matter/0.1 card into a PDF as EmbeddedFiles attachment open-matter.yaml. Use when a PDF needs a portable digest.
---

# Write a card into a PDF

You are the teacher. Follow the open-matter convention skill for the envelope and digest.

## PDF pocket

- Reserved name: `open-matter.yaml` (legacy read: `agent-frontmatter.yaml`).
- Store as an `EmbeddedFiles` attachment (PDF 1.4+). MIME `application/yaml`.
- Do not change the visible pages.
- `content_sha256` is the first 16 hex of SHA-256 of extracted text, pages joined with `\n\n`.

## After the write

A **separate** evaluation, written from the page text and not from this card, must pass. If it fails, add cited facts that cover the misses. Do not paste the gold answers into the YAML.

If the `write_manifest` tool is available, use it. Otherwise write the YAML and embed with `packages/open-matter` (`writeManifest`).
