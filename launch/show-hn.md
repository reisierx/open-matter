# Show HN drafts

Post Tuesday–Thursday, 09:00–12:00 US Eastern. Fallback: Sunday ~19:00 Eastern.
Link the live site. Repo in the first line of the maker comment. Never ask for upvotes.

## Title options

1. Show HN: open-matter – a 1 KB card written on a PDF read you were already doing
2. Show HN: open-matter – stop making AI re-read the same PDF
3. Show HN: open-matter – a 1 KB YAML card inside a PDF so agents can skip the parse

Prefer 1.

## Post body

AI already reads PDFs. It just does it from scratch every time, and the understanding is thrown away when the read ends.

open-matter writes a reserved attachment, `open-matter.yaml`, on a read you were already paying for. Later readers open the card instead of the pages. Tools that do not look still get a normal PDF.

Live: https://open-matter.org
Spec (CC0) and Claude plugin: https://github.com/reisierx/open-matter

## Maker first comment

The card is exhaust, not an investment. Your agent was going to read the file anyway. On the way out it leaves a 1 KB cited digest inside the file.

Readers look it up, fall back if it is missing or stale, and never treat a field as a prompt. An evaluation written from the pages has to pass before we attach.

Stack: TypeScript, pdf-lib, Vercel, a bundled MCP in the Claude plugin. The app reads the file in the browser. Nothing is stored.

Honest limitation: most tools do not look for the card today. The plugin both writes and reads, so one party gets value with nobody else adopting anything.

Try one file and tell me where this breaks.
