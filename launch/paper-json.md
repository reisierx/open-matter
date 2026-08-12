Subject: Embedded over sidecar — a note on paper.json and pdf-frontmatter

Hello,

I read paper.json and the problem it solves for arXiv papers: a machine-readable sidecar so an agent does not have to parse the PDF to learn the title, the sections, the claims.

I have been working on the same problem for PDFs that are not papers, and for papers once they leave the arXiv page. The weakness of a sidecar is the forward button. The YAML stays on the server. The PDF goes to counsel, to a records system, to another model.

pdf-frontmatter puts a reserved attachment, `agent-frontmatter.yaml`, inside the PDF using EmbeddedFiles. Same idea as paper.json — a small, honest index — but bound to the file. A `derived` key can point at a paper.json (or a DocLang document) riding along as a second attachment.

I am not asking you to abandon the sidecar. I am asking whether an embedded copy, written at the same time, would survive the paths your papers actually take.

The spec is CC0. I would value a correction if the reserved name or the schema fights something you already have in flight.

Gonçalo
Lisbon
