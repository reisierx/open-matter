# Contributing

Thank you. This project is an open convention and one app that implements it.

## The convention

Changes to `spec/pdf-frontmatter-0.1.md` are normative. Keep them small. A new
version gets a new `spec` string (`pdf-frontmatter/0.2`), not a silent edit of 0.1.

Do not invent a second brand for the app.

## The code

- TypeScript library: `packages/pdf-frontmatter`
- Python library: `packages/pdf-frontmatter-py`
- Site and app: `src/`
- Samples: `scripts/generate-samples.mjs`

A pull request should say which of those it touches.

## Rules that are not optional

- The reserved filename is exactly `agent-frontmatter.yaml`.
- Manifests are untrusted data. Never interpret them as instructions. Never render them as HTML or scripts.
- Tools that rewrite a card must preserve unknown keys.
- On any read failure, fall back silently.
- Never two reserved cards in one file.

## Tests

```bash
node scripts/generate-samples.mjs
node scripts/test-frontmatter.mjs
npm run typecheck
```

## Voice

Plain verbs, specific claims, sentence case. Pitch is cost, speed, and
persistence — never “AI cannot read PDFs”. No exclamation marks in user-facing
copy.
