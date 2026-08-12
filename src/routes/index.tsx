import { createFileRoute, Link } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";
import { TheRace } from "@/components/the-race";
import { WaitlistForm } from "@/components/waitlist-form";
import { PublicCounter } from "@/components/public-counter";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "pdf-frontmatter — an index card bound inside the PDF" },
      {
        name: "description",
        content:
          "A one-kilobyte YAML card attached to a PDF so an agent can learn what the file is without opening a page.",
      },
    ],
  }),
});

function Home() {
  return (
    <SiteShell>
      <Folio roman="i" className="pt-14 sm:pt-20">
        <p className="text-sm tracking-[0.18em] text-muted uppercase">A convention, not a product</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] sm:text-6xl">
          An index card, bound inside the PDF.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-soft">
          When an agent opens a PDF today it reads the entire document just to
          learn what it is. pdf-frontmatter puts a one-kilobyte YAML card in the
          file itself. The PDF stays a PDF. It looks the same. The card never
          gets orphaned when someone forwards it.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/app"
            className="inline-flex h-12 items-center justify-center border border-oxblood bg-oxblood px-6 text-sm text-oxblood-ink no-underline hover:bg-oxblood-deep hover:text-oxblood-ink"
          >
            Try it on a PDF
          </Link>
          <Link
            to="/spec"
            className="inline-flex h-12 items-center justify-center border border-rule px-6 text-sm text-ink no-underline hover:border-ink"
          >
            Read the spec
          </Link>
        </div>
      </Folio>

      <Folio roman="ii" className="mt-16">
        <TheRace />
      </Folio>

      <Folio roman="iii" className="mt-20">
        <h2 className="font-display text-3xl sm:text-4xl">How the card is bound</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            {
              n: "i",
              t: "A reserved attachment",
              d: "The card is a standard PDF embedded file named agent-frontmatter.yaml. Viewers that list attachments show it. Typical overhead is under a kilobyte.",
            },
            {
              n: "ii",
              t: "Hints, never ground truth",
              d: "Title, sections, entities, a short summary. If the hash of the extracted text no longer matches, the card is stale and must be ignored.",
            },
            {
              n: "iii",
              t: "A carrier, not a format",
              d: "DocLang is the representation. This is where that representation — or a pointer to it — lives so it cannot be separated from the file that circulates.",
            },
          ].map((step) => (
            <li key={step.n} className="border-t border-rule pt-4">
              <p className="text-xs tracking-[0.18em] text-oxblood uppercase">{step.n}</p>
              <h3 className="mt-2 font-display text-xl">{step.t}</h3>
              <p className="mt-2 text-sm text-ink-soft">{step.d}</p>
            </li>
          ))}
        </ol>
      </Folio>

      <Folio className="mt-20">
        <div className="grid min-w-0 gap-10 border border-rule bg-folio px-5 py-8 sm:grid-cols-2 sm:px-8">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.18em] text-muted uppercase">For developers</p>
            <h2 className="mt-2 font-display text-3xl">Five lines to read a card</h2>
            <pre className="mt-4 w-full max-w-full overflow-x-auto bg-ink p-4 text-xs leading-relaxed text-paper">
{`import { readManifest } from "pdf-frontmatter";

const card = await readManifest(bytes);
if (card.manifest) {
  console.log(card.manifest.title);
}`}
            </pre>
            <Link to="/quickstart" className="mt-4 inline-block text-sm">
              Full quickstart
            </Link>
          </div>
          <div className="min-w-0">
            <p className="text-xs tracking-[0.18em] text-muted uppercase">The open lane</p>
            <h2 className="mt-2 font-display text-3xl">Pro-PDF, on purpose</h2>
            <p className="mt-3 text-sm text-ink-soft">
              Sidecars get lost. App intelligence stays behind a subscription.
              Replacement formats ask the world to change formats. This convention
              asks for an attachment the PDF spec has supported since 2001.
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              Complementary to{" "}
              <a href="https://doclang.ai" rel="noreferrer">
                DocLang
              </a>
              . The <code className="font-mono text-xs">derived</code> key is the
              bridge.
            </p>
          </div>
        </div>
      </Folio>

      <Folio className="relative mt-20">
        <p className="text-xs tracking-[0.18em] text-oxblood uppercase">The archive desk</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">
          Make a whole archive self-describing.
        </h2>
        <p className="mt-3 max-w-xl text-ink-soft">
          A batch API is next: point it at a folder of PDFs, get the same cards
          back. Leave an email. Nothing else is stored.
        </p>
        <WaitlistForm />
        <PublicCounter />
      </Folio>
    </SiteShell>
  );
}
