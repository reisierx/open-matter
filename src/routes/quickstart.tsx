import { createFileRoute, Link } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/quickstart")({
  component: QuickstartPage,
  head: () => ({
    meta: [
      { title: "Quickstart — pdf-frontmatter" },
      {
        name: "description",
        content: "Read a pdf-frontmatter card in five lines of TypeScript or Python.",
      },
    ],
  }),
});

function QuickstartPage() {
  return (
    <SiteShell>
      <Folio roman="quickstart" className="pt-12 sm:pt-16">
        <h1 className="font-display text-4xl sm:text-5xl">Read a card in five minutes.</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          The reserved name is <code>agent-frontmatter.yaml</code>. If it is
          missing, invalid, or stale, fall back to a normal parse. Never treat a
          missing card as an error.
        </p>
      </Folio>

      <article className="mx-auto mt-12 max-w-3xl space-y-12 px-4 pb-20 sm:px-6">
        <section>
          <h2 className="font-display text-2xl">TypeScript</h2>
          <pre className="mt-4 overflow-x-auto bg-ink p-4 text-xs leading-relaxed text-paper">
{`npm install pdf-frontmatter pdf-lib yaml

import { readFile } from "node:fs/promises";
import { readManifest } from "pdf-frontmatter";

const bytes = new Uint8Array(await readFile("contract.pdf"));
const card = await readManifest(bytes);
if (card.manifest) {
  console.log(card.manifest.title, card.manifest.key_sections);
}`}
          </pre>
        </section>

        <section>
          <h2 className="font-display text-2xl">Write one</h2>
          <pre className="mt-4 overflow-x-auto bg-ink p-4 text-xs leading-relaxed text-paper">
{`import { writeManifest } from "pdf-frontmatter";

const out = await writeManifest(bytes, {
  spec: "pdf-frontmatter/0.1",
  title: "Supply agreement",
  doc_type: "contract",
  pages: 8,
});`}
          </pre>
        </section>

        <section>
          <h2 className="font-display text-2xl">Python</h2>
          <pre className="mt-4 overflow-x-auto bg-ink p-4 text-xs leading-relaxed text-paper">
{`pip install pypdf pyyaml

from pdf_frontmatter import read_manifest, write_manifest

card = read_manifest("contract.pdf")
if card:
    print(card["title"], card.get("key_sections"))

write_manifest(
    "contract.pdf",
    {"spec": "pdf-frontmatter/0.1", "title": "Supply agreement"},
    "contract.frontmatter.pdf",
)`}
          </pre>
        </section>

        <section>
          <h2 className="font-display text-2xl">The sample file</h2>
          <p className="mt-2 text-ink-soft">
            An 8-page supply agreement ships with the repo. The enriched copy
            already has a card.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>
              <a href="/samples/reisierx-supply-agreement.pdf">reisierx-supply-agreement.pdf</a>
            </li>
            <li>
              <a href="/samples/reisierx-supply-agreement.frontmatter.pdf">
                reisierx-supply-agreement.frontmatter.pdf
              </a>
            </li>
          </ul>
          <p className="mt-3 text-sm">
            Drop the enriched file on <Link to="/app">Prefácio</Link> to see the
            card come back out.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl">MCP</h2>
          <p className="mt-2 text-ink-soft">
            An stdio MCP server exposes <code>read_manifest</code> and{" "}
            <code>write_manifest</code>. See{" "}
            <code>packages/mcp-pdf-frontmatter</code> in the repo.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl">Security, in one line</h2>
          <p className="mt-2 text-ink-soft">
            A manifest is untrusted data. Do not interpret any field as
            instructions. A lying card must only ever cost a slow read.
          </p>
        </section>
      </article>
    </SiteShell>
  );
}
