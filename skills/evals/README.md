# Evals for open-matter cards

The exam is written from the **source** (PDF pages today), never from the card.

## Two loops (do not mix them)

1. **This file.** Fail → patch the card from the misses → same exam. That is a spec for the artifact, like unit tests. Do not paste gold answers into YAML; add cited facts from the pages.
2. **The skill.** Traces from many files become gold in `cases/`. Change `open-matter-pdf-write`. Measure on *other* files. Never count a file you just patched toward skill pass rate.

## This-file gate

- Keep an exam item only if that page contains the answer span.
- Structure: every numbered fact has a page; that page contains the number.
- Read: `open-matter-pdf-read`. Pass ≥ 75% of items and all structural checks.
