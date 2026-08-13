# Show HN drafts

Post Tuesday–Thursday, 09:00–12:00 US Eastern. Fallback: Sunday ~19:00 Eastern.
Link the live site. Repo in the first line of the maker comment. Never ask for upvotes.

## Title options

1. Show HN: pdf-frontmatter – a 1 KB card in a PDF so agents (and local models) skip the parse
2. Show HN: pdf-frontmatter – stop making AI re-read the same PDF
3. Show HN: pdf-frontmatter – a 1 KB YAML card inside a PDF so agents can skip the parse

Prefer 1. An honest measured multiple is allowed if you re-check the race that morning.

## Post body

AI already reads PDFs. It just does it from scratch every time, and the understanding is thrown away when the read ends.

Prefill is wall-clock. Small and local models degrade on long documents. Sidecars get orphaned. App intelligence stays in the app.

pdf-frontmatter puts a reserved attachment, `agent-frontmatter.yaml`, inside the file. A frontier model writes a 1 KB card once. Later readers — including an 8B model on your machine — read the card instead of the pages.

Writing the card costs one full read. Savings start at the second. Tools that do not look still get a normal PDF.

Live: https://pdf-frontmatter.org (drop your own file, ask it a question)
Spec (CC0), TypeScript, Python, MCP: https://github.com/reisierx/pdf-frontmatter

## Maker first comment

I built this because I was tired of paying the same parse on the same contracts, and because the models I run locally fall apart once the context is a real document.

How it works: a 1 KB YAML file attached to the PDF under a reserved name. Readers look it up, fall back if it is missing or stale, and never treat a field as a prompt.

Stack: TypeScript, pdf-lib, a small site on Vercel, an MCP server in the repo. The app reads the file in the browser. The model sees extracted text long enough to write the card and answer one question, then forgets both. Nothing is stored.

Honest limitation: most tools do not look for the card today. A convention without consumers is a file nobody opens, so the readers ship with the spec. Preview on a Mac will not even list the attachment; Acrobat will.

If you have a local stack or a document archive, try one file and tell me where this breaks.
