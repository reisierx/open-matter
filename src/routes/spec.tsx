import { createFileRoute } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";
import { useState } from "react";

export const Route = createFileRoute("/spec")({
  component: SpecPage,
  head: () => ({
    meta: [
      { title: "Specification — pdf-frontmatter/0.1" },
      {
        name: "description",
        content: "Normative text of pdf-frontmatter/0.1. CC0. Reserved filename agent-frontmatter.yaml.",
      },
    ],
  }),
});

const EXAMPLE = `spec: pdf-frontmatter/0.1
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
entities: [REISIERX Lda]
extraction:
  scanned: false
  tables_on_pages: [2, 7]
derived:
  doclang: doc.doclang.json
content_sha256: 335671f796b07b02
generated_by: <model or tool id>
generated_at: 2026-08-13
`;

function SpecPage() {
  const [copied, setCopied] = useState(false);

  return (
    <SiteShell>
      <Folio roman="spec" className="pt-12 sm:pt-16">
        <p className="text-sm text-muted">Published 13 August 2026 · CC0 1.0</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">pdf-frontmatter / 0.1</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Normative text. Implementations that want to interoperate must follow
          the sentences that say <em>must</em>. A copyable file lives at{" "}
          <a href="/spec/pdf-frontmatter-0.1.md">/spec/pdf-frontmatter-0.1.md</a>.
        </p>
      </Folio>

      <article className="mx-auto mt-12 max-w-3xl space-y-10 px-4 pb-20 sm:px-6">
        <Section n="1" title="What this is">
          <p>
            pdf-frontmatter is a convention for putting a small, machine-readable
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
            <code>agent-frontmatter.yaml</code>. Typical overhead is under 1 KB.
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
              <code>agent-frontmatter.yaml</code>.
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
              ["spec", "Must be the exact string pdf-frontmatter/0.1."],
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
              ["key_sections", "snake_case name → 1-based starting page."],
              ["entities", "Organisations and people. At most 8."],
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
            This version is <code>pdf-frontmatter/0.1</code>. A future version
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
      </article>
    </SiteShell>
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
