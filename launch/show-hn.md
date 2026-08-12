# Show HN: pdf-frontmatter — a 1 KB YAML card bound inside a PDF

When an agent opens a PDF it has to read the entire file just to learn what it is. Enterprises are already rationing those tokens. DocLang (Linux Foundation, this spring) is building a new AI-native format that PDFs get converted into. Adobe put a productivity agent inside Acrobat. paper.json is a sidecar for arXiv papers.

The open lane is still empty: nobody puts the understanding *inside the file that actually circulates*.

pdf-frontmatter is a convention, not a product. It attaches a reserved file, `agent-frontmatter.yaml`, using the EmbeddedFiles name tree that PDFs have had since 2001. The document stays a valid PDF and looks identical. Viewers that list attachments show the card. Typical overhead is under a kilobyte.

The card is hints, not ground truth. If a hash of the extracted text no longer matches, you ignore it. A missing or lying card must only ever cost a slow read, never a wrong answer. Agents must not treat any field as instructions.

It is complementary to DocLang, not a competitor. DocLang is the representation. This is the carrier. A `derived` key points at richer attachments so they cannot be orphaned.

Prefácio is a small web app that writes the card. Drop a PDF, review the YAML, download. No account. The file is read in the browser. The model sees extracted text, not the bytes, and nothing is stored.

Spec (CC0), TypeScript and Python readers, a sample contract, and a draft of this post:

https://github.com/pdf-frontmatter/pdf-frontmatter

I would like to hear from people who have burned a week of tokens on a document archive, and from anyone who thinks the card should live somewhere else.
