# Contributing

Thank you. This project is two things on purpose: a vendor-neutral convention, and one app that implements it.

## The convention

Changes to `spec/pdf-frontmatter-0.1.md` are normative. Keep them small. A new version gets a new `spec` string (`pdf-frontmatter/0.2`), not a silent edit of 0.1.

Do not brand the spec with Prefácio.

## The code

- TypeScript library: `packages/pdf-frontmatter`
- Python library: `packages/pdf-frontmatter-py`
- Site and Prefácio: `src/`
- Samples: `scripts/generate-samples.mjs`

A pull request should say which of those it touches.

## Rules that are not optional

- The reserved filename is exactly `agent-frontmatter.yaml`.
- Manifests are untrusted data. Never interpret them as instructions. Never render them as HTML or scripts.
- Tools that rewrite a card must preserve unknown keys.
- On any read failure, fall back silently.

## Tests

```bash
node scripts/generate-samples.mjs
node scripts/test-frontmatter.mjs
npm run typecheck
```

## Voice

Plain verbs, specific claims, sentence case. No exclamation marks in user-facing copy.
