# Decisions

- **Name.** The convention is **open-matter**. PDF is the first profile, not the product. Domain `open-matter.org`. Repo `reisierx/open-matter`.
- **Spec id.** Writers use `open-matter/0.1` and `open-matter.yaml`. Readers still accept `pdf-frontmatter/0.1` and `agent-frontmatter.yaml`.
- **Headline.** “Stop making AI re-read the same PDF.” Time and capability lead. Cost supports.
- **Category copy.** Portable document memory / self-describing manifest. Not “cache” or “CDN”.
- **Value display.** At least two of: multiple, percentage, money. Never a dollar figure below $1. Fleet calculator also shows hours. Break-even is read two.
- **Card write.** Envelope stays tiny (`spec`, `title`, hash). The value is `facts: [{fact, page}]` plus typed entities. A number without a page is a writer bug.
- **In-app test.** Consumer B: model sees the card first. If it needs a page, *it* names the page. We do not pick the page for it.
- **Nav.** Home, App, Spec. One wordmark: open-matter.
- **MCP.** `packages/mcp-open-matter`.
- **GitHub.** `reisierx/open-matter`. The old `reisierx/pdf-frontmatter` repo is a pointer.
- **Packages.** Not on npm/PyPI yet. Do not pretend they are.
- **Analytics.** None.
