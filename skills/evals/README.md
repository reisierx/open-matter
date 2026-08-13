# Evals for open-matter cards

The exam is written from the **pages**, never from the card.

## Two layers

1. **This file (product gate).** After a write, generate `(question, answer, page)` from the extract. Keep an item only if that page text contains the answer span. Then:
   - Structure: every numbered fact has a page; that page contains the number.
   - Read: card-first (`open-matter-read`). Pass ≥ 75% of exam items and all structural checks.
2. **The skill (our job).** Failing traces become gold cases in `cases/`. Re-run when `SKILL.md` or the writer prompt changes.

## What we do not do

- Let the writer invent the questions.
- Score “helpfulness” 1–5.
- Download a card that failed money or party checks.

The site is the first runner. The portable unit is `skills/open-matter-write` and `skills/open-matter-read`.
