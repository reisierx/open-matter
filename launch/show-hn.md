# Show HN drafts

Post Tuesday–Thursday, 09:00–12:00 US Eastern. Fallback: Sunday ~19:00 Eastern.
Link the live site. Repo in the first line of the maker comment. Never ask for upvotes.

## Title options (pick one)

1. Show HN: pdf-frontmatter – a 1 KB YAML card inside a PDF so agents can skip the parse
2. Show HN: pdf-frontmatter – a 1 KB card inside a PDF so agents skip the parse (~10× fewer tokens on re-reads)
3. Show HN: pdf-frontmatter – stop paying AI to re-read the same PDF

Prefer 1 if you want it quiet. Prefer 2 if the sample number is still honest the morning you post (measure the race that day). Do not use “revolutionary”, “game-changer”, or “finally”.

## Post body

AI already reads PDFs. It just does it the expensive way, every time, and throws the understanding away. Forward the file and the next model starts from zero.

Sidecars get orphaned. App intelligence stays in the app. New formats ask the world to stop using PDF.

pdf-frontmatter puts a reserved attachment, `agent-frontmatter.yaml`, inside the file using EmbeddedFiles (PDF 1.4). The document stays a valid PDF and looks the same. Typical overhead is under a kilobyte.

The card is hints, not ground truth. If a hash of the extracted text no longer matches, ignore it. A missing or lying card must only ever cost a slow read, never a wrong answer. Nothing in the card is instructions.

Writing the card costs one full read. Savings start at the second. Tools that do not look for the card still get a normal PDF.

Live: https://pdf-frontmatter.org
Spec (CC0), TypeScript, Python: https://github.com/reisierx/pdf-frontmatter

## Maker first comment (post immediately after submitting)

I built this because I was tired of paying for the same parse on the same contracts.

How it works: a 1 KB YAML file attached to the PDF under a reserved name. Readers look it up, fall back if it is missing or stale, and never treat a field as a prompt.

Stack: TypeScript, pdf-lib, a small site on Vercel. The app reads the file in the browser and only sends extracted text if you ask a model to draft the card. Nothing is stored. No account.

Honest limitation: most tools do not look for the card today. The bet is that five lines in an ingestion library is a smaller ask than a new file format. Preview on a Mac will not even list the attachment; Acrobat will.

If you have a document archive that gets read by models, try one file and then tell me where this breaks.
