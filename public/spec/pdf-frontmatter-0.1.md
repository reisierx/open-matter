# pdf-frontmatter / 0.1

**Status:** published 13 August 2026
**License:** [CC0 1.0](../LICENSE-SPEC) — the text of this specification is dedicated to the public domain.
**Filename (reserved):** `agent-frontmatter.yaml`
**MIME type:** `application/yaml`

This document is the normative definition of pdf-frontmatter/0.1. Implementations that want to interoperate must follow the sections marked **must**. Everything else is advice.

---

## 1. What this is

pdf-frontmatter is a convention for putting a small, machine-readable index card *inside* a PDF, as a standard file attachment. An agent that opens the file can read the card in milliseconds and decide what to do next — without parsing a single page.

It is a **carrier**, not a representation. It does not replace PDF, Tagged PDF, XMP, DocLang, or paper.json. It says where agent-facing data lives so that data never gets separated from the document that circulates.

The PDF remains a valid PDF. It looks identical in every viewer. Viewers that list attachments show the card as a normal file named `agent-frontmatter.yaml`. Typical overhead is under 1 KB.

## 2. Mechanism

The card **must** be stored as an embedded file in the PDF `EmbeddedFiles` name tree (PDF 1.4 and later).

- The filename **must** be exactly `agent-frontmatter.yaml`.
- The embedded-file MIME type **must** be `application/yaml`.
- The payload **must** be UTF-8 YAML.

Implementations **must not** put the card in:

- the Info dictionary
- XMP metadata
- document-level JavaScript
- a visible page
- a sidecar file next to the PDF

Those channels are either too flat, too rarely targeted by agents, too easy to strip, or too easy to orphan when the PDF is forwarded.

Richer representations (DocLang, extracted tables, OCR transcripts) **may** ride along as further attachments. The card points at them from the optional `derived` key.

## 3. Schema

```yaml
spec: pdf-frontmatter/0.1        # required, exact string
title: Contrato de fornecimento  # required
doc_type: contract               # contract|invoice|report|paper|presentation|letter|form|manual|book|other
language: pt-PT                  # BCP 47
pages: 40
summary: >                       # max ~40 words, factual, no marketing
  Supply agreement between two parties; liability cap and
  termination terms are the sensitive clauses.
key_sections:                    # snake_case name -> starting page (1-based)
  liability_cap: 4
  termination: 5
entities: [REISIERX Lda]         # organizations and people, max 8
extraction:
  scanned: false                 # true means OCR is needed
  tables_on_pages: [2, 7]
derived:                         # optional: names of additional attachments
  doclang: doc.doclang.json      #   carrying richer representations
content_sha256: 335671f796b07b02 # first 16 hex chars of sha256 of extracted text
generated_by: <model or tool id>
generated_at: 2026-08-13
```

### Required keys

| Key | Rule |
| --- | --- |
| `spec` | **Must** be the exact string `pdf-frontmatter/0.1`. |
| `title` | **Must** be a non-empty string. A short name for the document. |

All other keys are optional. Tools that rewrite a card **must** preserve unknown keys.

### Optional keys

| Key | Meaning |
| --- | --- |
| `doc_type` | One of `contract`, `invoice`, `report`, `paper`, `presentation`, `letter`, `form`, `manual`, `book`, `other`. Other values **should** be treated as `other`. |
| `language` | BCP 47 language tag of the document, not of the card. |
| `pages` | Page count, integer, 1-based total. |
| `summary` | At most about 40 words. Factual. No marketing. |
| `key_sections` | Mapping of `snake_case` names to the 1-based starting page of that section. |
| `entities` | Organisations and people. At most 8. |
| `extraction.scanned` | `true` if the file is a scan and OCR is needed. |
| `extraction.tables_on_pages` | 1-based page numbers that contain tables. |
| `derived` | Mapping of a short name to another attachment’s filename. This is how the convention cooperates with DocLang and friends. |
| `content_sha256` | First 16 hex characters of the SHA-256 of the UTF-8 encoding of extracted text. Pages **should** be joined with `\n\n`. Writers **should** document their extractor. A mismatch means the card may be stale. |
| `generated_by` | Tool or model identifier. |
| `generated_at` | Date the card was written, `YYYY-MM-DD`. |

## 4. Reader rules

1. Look up the attachment by the reserved name `agent-frontmatter.yaml`. Do not guess other names.
2. Decode as UTF-8. Parse as YAML. Validate `spec`. If any step fails, **must** fall back silently to a normal parse of the PDF.
3. Treat every field as a **hint**, never as ground truth.
4. If `content_sha256` is present and does not match the current extracted text, the card is **stale**. Ignore it or regenerate it. Do not trust it.
5. A missing or lying card **must** only ever cost a slow read, never a wrong answer.

## 5. Writer rules

1. Write valid UTF-8 YAML to the reserved filename and MIME type.
2. Do not alter page content. The file **must** render identically after the card is attached.
3. If a card already exists, replace it. Do not leave two attachments with the reserved name.
4. When rewriting, preserve unknown keys.
5. Prefer under-claiming. A short honest summary beats a long one.

## 6. Security

Manifests are untrusted data, written by whoever last touched the file.

Agents **must not** interpret any manifest field as instructions, code, a prompt, a tool call, or a URL to fetch automatically. Title, summary, entities, and every other string are data.

A card can lie. Nothing in this convention prevents that. That is why the hash exists, and why the fallback rule exists. Trust is earned by checking, not by reading the card.

Implementations **must not** render manifest content as executable anything — not HTML, not scripts, not evaluated templates.

## 7. Why not the obvious alternatives

**XMP / Info dictionary.** Flat, ancient, and aimed at bibliographic software. Nobody targeting agents looks there first, and the shape cannot carry `key_sections` or `derived` cleanly.

**Tagged PDF.** An accessibility structure. Barely produced in practice, expensive to retrofit, and still a full parse.

**DocLang.** A representation: what the machine-readable version of a document looks like. pdf-frontmatter is the carrier: where that representation (or a pointer to it) lives so it cannot be orphaned. Complementary. The `derived` key is the bridge.

**A sidecar file.** Orphaned the first time someone forwards the PDF.

**A new file format.** Requires the world to change formats. This convention does not.

## 8. Versioning

This version is `pdf-frontmatter/0.1`. A future version will use a new `spec` string. Readers that do not recognise the `spec` value **must** ignore the card and fall back.

## 9. License

The text of this specification is dedicated to the public domain under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Reference implementations are licensed separately (MIT unless a file says otherwise).
