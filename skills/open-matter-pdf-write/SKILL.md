---
name: open-matter-pdf-write
description: Write an open-matter/0.1 card into a PDF as the reserved EmbeddedFiles attachment open-matter.yaml. Use when a PDF needs a portable digest.
---

# Write a card into a PDF

You are the teacher. Follow `skills/open-matter/SKILL.md` for the envelope and digest.

## PDF pocket

- Reserved name: `open-matter.yaml` (legacy read: `agent-frontmatter.yaml`).
- Store as an `EmbeddedFiles` attachment (PDF 1.4+). MIME `application/yaml`.
- Do not change the visible pages.
- `content_sha256` is the first 16 hex of SHA-256 of extracted text, pages joined with `\n\n`.

## After the write

A **separate** exam, written from the page text and not from this card, must pass. If it fails, add cited facts that cover the misses. Do not paste the exam answers into the YAML as a cheat sheet — extract them from the pages again, with cites.

Scripts: `packages/open-matter` (`writeManifest`). MCP: `write_manifest`.
