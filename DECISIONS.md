# Decisions

- **One site, two names.** The standard lives at `/`, `/spec`, `/quickstart`, `/faq`. Prefácio lives at `/app`. Same design system so a stranger can move between them; the standard is never branded Prefácio.
- **Host.** Ship on the platform’s Vercel path (this workspace already builds with the `vercel` Nitro preset). Founder can also point a custom domain at the same deploy. No second host.
- **Model.** Default `grok-4.5` via the xAI API (`XAI_API_KEY`). Provider, model, and base URL are swappable with `LLM_PROVIDER`, `LLM_MODEL`, `LLM_BASE_URL`. The key never reaches the browser.
- **Size cap.** 8 MB. Parsing and embedding run in the browser; larger files stall phones. Stated in plain words when hit.
- **Rate limit.** 6 generations per 10 minutes per IP (in-memory, plus a DB-backed waitlist throttle). Generation sends extracted text only, capped at 60 000 characters.
- **Wow moment.** The Race — same question, same document, naked PDF vs enriched PDF, live token counters and timers. Honest numbers from the real sample file, not a fake animation.
- **Design system.** Shared. Warm paper, ink, one oxblood accent, serif display (Fraunces) + serif body (Source Serif 4) + IBM Plex Mono. Near-zero radius: this is print, not a SaaS card grid.
- **Repo layout.** Monorepo: web app at the root, convention + TS/Python libraries under `packages/`, spec under `spec/`, launch kit under `launch/`.
- **Package names.** `pdf-frontmatter` on npm (name was free on 2026-08-13). Python: `pdf-frontmatter` on PyPI. MCP server: `mcp-pdf-frontmatter`.
- **Domains proposed.** Standard: `pdf-frontmatter.org` (RDAP: unregistered). App: `prefacio.app` (RDAP: unregistered). Alternates in `FOUNDER_TODO.md`.
- **Waitlist.** Email only, stored in Postgres/PGLite. No document content, no tracking pixels, no analytics SDK.
- **Counter.** Public running total of documents enriched and estimated tokens saved. Incremented on download via a content-free `recordEnrichment` call.
- **Auth.** Platform sign-in is wired (required by the template) but the product does not require an account. Prefácio and the waitlist work signed out.
- **Reference extractor.** `content_sha256` is SHA-256 of UTF-8 extracted text, first 16 hex chars. Pages joined with `\n\n`. A mismatch is “maybe stale,” never “trust the opposite.”
- **Analytics.** None. No third-party scripts besides the platform injector.
- **MCP.** Stretch: stdio server in `packages/mcp-pdf-frontmatter` with `read_manifest` / `write_manifest`.
- **Production preview.** `vite preview` is the wrong tool for the Vercel/Nitro output. Built assets live in `.vercel/output/static/assets` with `text/javascript` MIME; Vercel routes serve `/assets/*` before the HTML fallback. Local function preview needs `DATABASE_URL`.
- **XAI_API_KEY.** Not present while this was built. Prefácio still binds cards written by hand. Set the key (FOUNDER_TODO §4) before the writing desk can draft YAML.
