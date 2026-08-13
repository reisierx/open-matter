import { createFileRoute } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";
import { useState } from "react";

export const Route = createFileRoute("/spec")({
  component: SpecPage,
  head: () => ({
    meta: [
      { title: "Specification — open-matter/0.1" },
      {
        name: "description",
        content: "Normative text of open-matter/0.1. CC0. Reserved filename open-matter.yaml.",
      },
    ],
  }),
});

const EXAMPLE = `spec: open-matter/0.1
title: Contrato de fornecimento
doc_type: contract
language: pt-PT
pages: 40
summary: >
  Supply agreement between two parties; liability cap and
  termination terms are the sensitive clauses.
key_sections:
  liability_cap: 4
  termination: 5
entities:
  - name: REISIERX Lda
    role: Supplier
    page: 1
facts:
  - fact: Liability is capped at 12 months of fees
    page: 4
  - fact: Either party may terminate on 30 days' notice
    page: 5
extraction:
  scanned: false
  tables_on_pages: [2, 7]
derived:
  doclang: doc.doclang.json
content_sha256: 335671f796b07b02
generated_by: <model or tool id>
generated_at: 2026-08-13
`;

const FAQ = [
  {
    q: "Why not XMP or the Info dictionary?",
    a: "Both are flat, ancient, and aimed at bibliographic software. Nobody targeting agents looks there first, and the shape cannot carry key_sections or derived cleanly. An attachment has a name, a MIME type, and room to grow.",
  },
  {
    q: "Why not Tagged PDF?",
    a: "Tagged PDF is an accessibility structure. It is barely produced in practice, expensive to retrofit, and still a full parse. The card is a hint so a tool can decide whether that parse is worth it.",
  },
  {
    q: "Why not just DocLang?",
    a: "DocLang is the representation: what the machine-readable version of a document looks like. open-matter is the carrier: where that representation, or a pointer to it, lives so it cannot be orphaned. Complementary, not competing. The derived key is the bridge.",
  },
  {
    q: "What stops a card from lying?",
    a: "Nothing. That is why the hash and the fallback rule exist. If content_sha256 does not match the current extracted text, ignore the card or regenerate it. A missing or lying card must only ever cost a slow read, never a wrong answer.",
  },
  {
    q: "Does the PDF look different?",
    a: "No. Pages are not touched. Viewers that list attachments — Acrobat, many others — show open-matter.yaml as a normal file. macOS Preview does not list attachments. Typical overhead is under a kilobyte.",
  },
  {
    q: "Is this an Adobe product?",
    a: "No. The convention is called open-matter. The spec is CC0. The code is MIT. The app on this site is the standard’s front door, not a second brand.",
  },
  {
    q: "What does the app send to a model?",
    a: "Extracted text only, truncated, over HTTPS, from the server. The PDF bytes never leave the browser. Nothing is stored. There is no account.",
  },
  {
    q: "Can a card tell an agent what to do?",
    a: "No. Manifests are untrusted data. Agents must not interpret any field as instructions, code, a prompt, or a URL to fetch. Implementations must not render the card as executable anything.",
  },
  {
    q: "What about scanned PDFs?",
    a: "Set extraction.scanned to true. The card can still name the title, the parties, and the pages worth OCRing. The agent then knows to spend the expensive pass.",
  },
  {
    q: "Does every AI read the card today?",
    a: "No. Tools that look for the card skip the parse. Tools that don’t still get a normal PDF. The libraries and the MCP server are how a stack starts looking. Selling harder than that is a lie.",
  },
  {
    q: "Why does this matter for local models?",
    a: "Small models degrade on long context. Needle-in-haystack accuracy ranges from 22% to 92% across small models; the open-vs-closed gap widens past 4K tokens; an 8B model drops about 20 points from 8K to 32K (M4LE, L-CiteEval, SLM survey). Pre-digested artifacts reverse that gap. A 1 KB card is that artifact.",
  },
  {
    q: "Does skipping the parse save battery on a phone?",
    a: "On-device inference can drain 6–25% of a phone battery in under 15 minutes; most of that energy is data movement, not arithmetic. Every skipped re-parse saves seconds and joules. Sources: arXiv 2506.19884 and 2606.23001.",
  },
  {
    q: "Is latency just a cost problem?",
    a: "No. Prefill is a wall-clock tax proportional to document size. Token prices can fall; the seconds to ingest eight pages do not, unless you skip the ingest. See “Can I Buy Your KV Cache?” (arXiv 2606.13361) and Lost in the Middle (Liu et al., TACL 2024).",
  },
  {
    q: "Why not just use a bigger context window?",
    a: "Even long-context models degrade in the middle of the input (Liu et al., TACL 2024). Small and open models fall off a cliff past 4K tokens (M4LE). A card is not more context. It is less: a map, so the model loads one page instead of the haystack.",
  },
  {
    q: "Can a folder of cards become a knowledge graph?",
    a: "That is the downstream product, not a 0.1 guarantee. GraphRAG-style systems spend most of their cost on entity extraction. Cards ship entities and sections already named. Cross-document resolution still needs validation, so we frame it as exploration.",
  },
  {
    q: "Must every fact cite a page?",
    a: "Yes, if the fact contains a number, amount, date, or percentage. A cite-less number is a writer bug — omit it. The card is untrusted memory; a wrong $5,000 is worse than a map that says “fee: p.3”.",
  },
];

function SpecPage() {
  const [copied, setCopied] = useState(false);

  return (
    <SiteShell>
      <Folio roman="spec" className="pt-12 sm:pt-16">
        <p className="text-sm text-muted">
          <span className="border border-rule px-2 py-0.5 font-mono text-xs">0.1</span>
          {" · "}
          Published 13 August 2026 · CC0 1.0
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">open-matter / 0.1</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Normative text. Implementations that want to interoperate must follow
          the sentences that say <em>must</em>. Version 0.1 is the PDF profile.
          A copyable file lives at{" "}
          <a href="/spec/open-matter-0.1.md">/spec/open-matter-0.1.md</a>.
        </p>
        <p className="mt-4 text-sm text-muted">
          <a href="#install" className="text-ink-soft no-underline hover:text-oxblood">
            Install
          </a>
          {" · "}
          <a href="#implementations" className="text-ink-soft no-underline hover:text-oxblood">
            Implementations
          </a>
          {" · "}
          <a href="#consumers" className="text-ink-soft no-underline hover:text-oxblood">
            Consumers
          </a>
          {" · "}
          <a href="#conformance" className="text-ink-soft no-underline hover:text-oxblood">
            Conformance
          </a>
          {" · "}
          <a href="#changelog" className="text-ink-soft no-underline hover:text-oxblood">
            Changelog
          </a>
          {" · "}
          <a href="#faq" className="text-ink-soft no-underline hover:text-oxblood">
            FAQ
          </a>
        </p>
      </Folio>

      <article className="mx-auto mt-12 max-w-3xl space-y-10 px-4 pb-20 sm:px-6">
        <Section n="1" title="What this is">
          <p>
            open-matter is a convention for putting a small, machine-readable
            index card <em>inside</em> a PDF, as a standard file attachment. An
            agent that opens the file can read the card in milliseconds and decide
            what to do next — without parsing a single page.
          </p>
          <p>
            It is a <strong>carrier</strong>, not a representation. It does not
            replace PDF, Tagged PDF, XMP, DocLang, or paper.json. It says where
            agent-facing data lives so that data never gets separated from the
            document that circulates.
          </p>
          <p>
            The PDF remains a valid PDF. It looks identical in every viewer.
            Viewers that list attachments show the card as a normal file named{" "}
            <code>open-matter.yaml</code>. Typical overhead is under 1 KB.
          </p>
        </Section>

        <Section n="2" title="Mechanism">
          <p>
            The card <strong>must</strong> be stored as an embedded file in the PDF{" "}
            <code>EmbeddedFiles</code> name tree (PDF 1.4 and later).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              The filename <strong>must</strong> be exactly{" "}
              <code>open-matter.yaml</code>.
            </li>
            <li>
              The embedded-file MIME type <strong>must</strong> be{" "}
              <code>application/yaml</code>.
            </li>
            <li>
              The payload <strong>must</strong> be UTF-8 YAML.
            </li>
          </ul>
          <p>Implementations must not put the card in:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>the Info dictionary</li>
            <li>XMP metadata</li>
            <li>document-level JavaScript</li>
            <li>a visible page</li>
            <li>a sidecar file next to the PDF</li>
          </ul>
          <p>
            Richer representations (DocLang, extracted tables, OCR transcripts) may
            ride along as further attachments. The card points at them from the
            optional <code>derived</code> key.
          </p>
        </Section>

        <Section n="3" title="Schema">
          <div className="relative">
            <button
              type="button"
              className="absolute top-2 right-2 border border-rule-strong bg-folio px-2 py-1 text-xs text-ink"
              onClick={async () => {
                await navigator.clipboard.writeText(EXAMPLE);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <pre className="overflow-x-auto bg-ink p-4 text-xs leading-relaxed text-paper">{EXAMPLE}</pre>
          </div>
          <h3 className="mt-6 font-display text-xl">Required keys</h3>
          <SpecTable
            rows={[
              ["spec", "Must be the exact string open-matter/0.1."],
              ["title", "Must be a non-empty string. A short name for the document."],
            ]}
          />
          <p className="mt-3">
            All other keys are optional. Tools that rewrite a card{" "}
            <strong>must</strong> preserve unknown keys.
          </p>
          <h3 className="mt-6 font-display text-xl">Optional keys</h3>
          <SpecTable
            rows={[
              ["doc_type", "contract | invoice | report | paper | presentation | letter | form | manual | book | other."],
              ["language", "BCP 47 tag of the document, not of the card."],
              ["pages", "Page count, integer."],
              ["summary", "At most about 40 words. Factual. No marketing."],
              ["key_sections", "Section name → 1-based starting page."],
              ["entities", "Name, or {name, role, page}."],
              ["facts", "Cited digest. {fact, page}. A number without a page is a writer bug."],
              ["extraction.scanned", "true if OCR is needed."],
              ["extraction.tables_on_pages", "1-based pages that contain tables."],
              ["derived", "Short name → another attachment’s filename. The DocLang bridge."],
              ["content_sha256", "First 16 hex chars of SHA-256 of UTF-8 extracted text."],
              ["generated_by", "Tool or model identifier."],
              ["generated_at", "YYYY-MM-DD."],
            ]}
          />
        </Section>

        <Section n="4" title="Reader rules">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Look up the attachment by the reserved name. Do not guess other names.</li>
            <li>
              Decode as UTF-8. Parse as YAML. Validate <code>spec</code>. If any
              step fails, <strong>must</strong> fall back silently to a normal parse.
            </li>
            <li>Treat every field as a hint, never as ground truth.</li>
            <li>
              If <code>content_sha256</code> is present and does not match, the
              card is stale. Ignore it or regenerate it.
            </li>
            <li>
              A missing or lying card <strong>must</strong> only ever cost a slow
              read, never a wrong answer.
            </li>
          </ol>
        </Section>

        <Section n="5" title="Writer rules">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Write valid UTF-8 YAML to the reserved filename and MIME type.</li>
            <li>Do not alter page content. The file must render identically.</li>
            <li>If a card already exists, replace it. Do not leave two reserved names.</li>
            <li>When rewriting, preserve unknown keys.</li>
            <li>Prefer under-claiming. A short honest summary beats a long one.</li>
          </ol>
        </Section>

        <Section n="6" title="Security">
          <p>Manifests are untrusted data, written by whoever last touched the file.</p>
          <p>
            Agents <strong>must not</strong> interpret any field as instructions,
            code, a prompt, a tool call, or a URL to fetch automatically. Title,
            summary, entities, and every other string are data.
          </p>
          <p>
            A card can lie. Nothing in this convention prevents that. That is why
            the hash exists, and why the fallback rule exists.
          </p>
          <p>
            Implementations <strong>must not</strong> render manifest content as
            executable anything — not HTML, not scripts, not evaluated templates.
          </p>
        </Section>

        <Section n="7" title="Why not the obvious alternatives">
          <p>
            <strong>XMP / Info dictionary.</strong> Flat, ancient, aimed at
            bibliographic software. Nobody targeting agents looks there first.
          </p>
          <p>
            <strong>Tagged PDF.</strong> An accessibility structure. Barely produced
            in practice, expensive to retrofit, and still a full parse.
          </p>
          <p>
            <strong>DocLang.</strong> A representation. This is the carrier. The{" "}
            <code>derived</code> key is the bridge.
          </p>
          <p>
            <strong>A sidecar file.</strong> Orphaned the first time someone
            forwards the PDF.
          </p>
          <p>
            <strong>A new file format.</strong> Requires the world to change
            formats. This convention does not.
          </p>
        </Section>

        <Section n="8" title="Versioning">
          <p>
            This version is <code>open-matter/0.1</code>. A future version
            will use a new <code>spec</code> string. Readers that do not recognise
            the value must ignore the card and fall back.
          </p>
        </Section>

        <Section n="9" title="License">
          <p>
            The text of this specification is dedicated to the public domain under{" "}
            <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0</a>.
            Reference implementations are MIT unless a file says otherwise.
          </p>
        </Section>

        <section id="install" className="space-y-3">
          <h2 className="border-t border-rule pt-6 font-display text-2xl">
            <span className="mr-3 text-oxblood">A</span>
            Install
          </h2>
          <p className="text-ink-soft">
            The libraries live in the repo today. npm and PyPI names are reserved
            for v0.1.0; until that publish, copy from{" "}
            <a href="https://github.com/reisierx/open-matter">GitHub</a>.
          </p>
          <CopyBlock
            code={`// TypeScript — from the repo
import { readManifest } from "open-matter";

const card = await readManifest(bytes);
if (card.manifest) {
  // hints only. fall back if missing, invalid, or stale.
}`}
          />
          <CopyBlock
            code={`# Python — from packages/open-matter-py
from open_matter import read_manifest`}
          />
        </section>

        <section id="implementations" className="space-y-3">
          <h2 className="border-t border-rule pt-6 font-display text-2xl">
            <span className="mr-3 text-oxblood">B</span>
            Implementations
          </h2>
          <SpecTable
            rows={[
              ["TypeScript", "packages/open-matter — read, write, hash, CLI."],
              ["Python", "packages/open-matter-py — skeleton, same reserved name."],
              ["MCP", "packages/mcp-open-matter — read_manifest / write_manifest (stdio)."],
              ["This site", "The /app page writes cards in the browser. No account."],
            ]}
          />
        </section>

        <section id="consumers" className="space-y-3">
          <h2 className="border-t border-rule pt-6 font-display text-2xl">
            <span className="mr-3 text-oxblood">B2</span>
            Who reads cards today
          </h2>
          <p className="text-ink-soft">
            A convention without consumers is a file nobody opens. These do:
          </p>
          <SpecTable
            rows={[
              ["open-matter (TS)", "readManifest / writeManifest in this repo."],
              ["open-matter (Python)", "packages/open-matter-py."],
              ["MCP server", "npx mcp-open-matter — read_manifest, write_manifest."],
              ["This app", "/app writes a card and races it on your file."],
              ["Loaders", "None merged yet. PRs welcome: check the card before parsing."],
            ]}
          />
        </section>

        <section id="conformance" className="space-y-3">
          <h2 className="border-t border-rule pt-6 font-display text-2xl">
            <span className="mr-3 text-oxblood">C</span>
            Conformance
          </h2>
          <p className="text-ink-soft">Self-certify. An implementation conforms to 0.1 if:</p>
          <ol className="list-decimal space-y-2 pl-5 text-ink-soft">
            <li>The reserved filename is exactly <code>open-matter.yaml</code>.</li>
            <li>The MIME type is <code>application/yaml</code>.</li>
            <li>On any read failure, it falls back silently to a normal parse.</li>
            <li>Tools that rewrite a card preserve unknown keys.</li>
            <li>A rewrite replaces the existing card. Never two reserved names.</li>
          </ol>
        </section>

        <section id="changelog" className="space-y-3">
          <h2 className="border-t border-rule pt-6 font-display text-2xl">
            <span className="mr-3 text-oxblood">D</span>
            Changelog
          </h2>
          <p className="text-ink-soft">
            <strong>0.1</strong> — 13 August 2026. First public text.{" "}
            <a href="https://github.com/reisierx/open-matter">Source</a>.
          </p>
        </section>

        <section id="faq" className="space-y-6">
          <h2 className="border-t border-rule pt-6 font-display text-2xl">
            <span className="mr-3 text-oxblood">E</span>
            FAQ
          </h2>
          {FAQ.map((item) => (
            <div key={item.q}>
              <h3 className="font-display text-xl">{item.q}</h3>
              <p className="mt-2 text-ink-soft">{item.a}</p>
            </div>
          ))}
        </section>
      </article>
    </SiteShell>
  );
}

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="absolute top-2 right-2 border border-rule-strong bg-folio px-2 py-1 text-xs text-ink"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto bg-ink p-4 text-xs leading-relaxed text-paper">{code}</pre>
    </div>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="border-t border-rule pt-6 font-display text-2xl">
        <span className="mr-3 text-oxblood">{n}</span>
        {title}
      </h2>
      <div className="space-y-3 text-ink-soft">{children}</div>
    </section>
  );
}

function SpecTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-t border-rule">
              <th className="py-2 pr-4 align-top font-mono text-xs font-medium text-ink">{k}</th>
              <td className="py-2 text-ink-soft">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
