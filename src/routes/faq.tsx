import { createFileRoute } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "FAQ — pdf-frontmatter" },
      { name: "description", content: "Straight answers about pdf-frontmatter, DocLang, XMP, and lying cards." },
    ],
  }),
});

const QA = [
  {
    q: "Why not XMP or the Info dictionary?",
    a: "Both are flat, ancient, and aimed at bibliographic software. Nobody targeting agents looks there first, and the shape cannot carry key_sections or derived cleanly. An attachment has a name, a MIME type, and room to grow.",
  },
  {
    q: "Why not Tagged PDF?",
    a: "Tagged PDF is an accessibility structure. It is barely produced in practice, expensive to retrofit, and still a full parse. The card is a hint so an agent can decide whether that parse is worth it.",
  },
  {
    q: "Why not just DocLang?",
    a: "DocLang is the representation: what the machine-readable version of a document looks like. pdf-frontmatter is the carrier: where that representation, or a pointer to it, lives so it cannot be orphaned. Complementary, not competing. The derived key is the bridge.",
  },
  {
    q: "What stops a manifest from lying?",
    a: "Nothing. That is why the hash and the fallback rule exist. If content_sha256 does not match the current extracted text, ignore the card or regenerate it. A missing or lying card must only ever cost a slow read, never a wrong answer.",
  },
  {
    q: "Does the PDF look different?",
    a: "No. Pages are not touched. Viewers that list attachments will show agent-frontmatter.yaml as a normal file. Typical overhead is under a kilobyte.",
  },
  {
    q: "Is this an Adobe product? A Prefácio product?",
    a: "Neither. The convention is called pdf-frontmatter everywhere. Prefácio is one app that writes the card. The spec is CC0. The code is MIT.",
  },
  {
    q: "What does Prefácio send to a model?",
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
    q: "Who is this for?",
    a: "Anyone whose PDFs get read by software: counsel, publishers, researchers, records teams, and the people writing the agents. The PDF Association has been writing about non-human readers since at least 2026. This is a small, boring, embeddable answer.",
  },
];

function FaqPage() {
  return (
    <SiteShell>
      <Folio roman="faq" className="pt-12 sm:pt-16">
        <h1 className="font-display text-4xl sm:text-5xl">Questions worth answering once.</h1>
      </Folio>
      <dl className="mx-auto mt-12 max-w-3xl space-y-8 px-4 pb-20 sm:px-6">
        {QA.map((item) => (
          <div key={item.q} className="border-t border-rule pt-5">
            <dt className="font-display text-xl">{item.q}</dt>
            <dd className="mt-2 text-ink-soft">{item.a}</dd>
          </div>
        ))}
      </dl>
    </SiteShell>
  );
}
