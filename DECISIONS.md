# Decisions

- **One name.** pdf-frontmatter is the convention and the app. Prefácio is retired.
- **Headline.** “Stop making AI re-read the same PDF.” Time and capability lead. Cost supports. Never “AI cannot read PDFs.”
- **Category copy.** Portable document memory / self-describing manifest. Not “cache” or “CDN”.
- **Value display.** At least two of: multiple, percentage, money. Never a dollar figure below $1. Single-document verdicts speak in multiples and time. Fleet calculator also shows hours of model-time. Break-even is read two.
- **Calculator defaults.** 1,000 documents, 12 pages, 20 reads/year, 220 tokens/page, 220-token card, 0.3s/page, 0.2s/card, $3/M input.
- **App.** No sample. Killer flow: drop → card → ask → race on their file → download. Card lane is a real answer. Plain lane is a paced replay of measured tokens. Steps i–iv.
- **Home race.** Autoplay on the default contract, honest labels, CTA “Now run it on your own PDF”.
- **Local models.** Own module on the home page. Evidence cited on the spec FAQ.
- **Nav.** Home, App, Spec. FAQ/quickstart redirect. Sign-in unlinked. Why in the footer.
- **Counters.** Hidden until real.
- **MCP.** `packages/mcp-pdf-frontmatter`, listed as a consumer. Ships with the spec because conventions without consumers die.
- **Host.** Vercel Hobby. `XAI_API_KEY` on the server. 8 MB cap. 6 card writes / 10 questions per 10 minutes / IP.
- **Design.** Paper, ink, oxblood. Metaphor only in numerals and the footer line.
- **GitHub.** `reisierx/pdf-frontmatter`.
- **Packages.** Not on npm/PyPI yet. Do not pretend they are.
- **Analytics.** None.
