import { createFileRoute, Link } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";
import { TheRace } from "@/components/the-race";
import { SavingsCalculator } from "@/components/savings-calculator";
import { WaitlistForm } from "@/components/waitlist-form";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "pdf-frontmatter — stop paying AI to re-read the same PDF" },
      {
        name: "description",
        content:
          "A 1 KB card inside the PDF carries what the document is and where things live. Written once. Tools that look for the card skip the parse.",
      },
      { property: "og:title", content: "Stop paying AI to re-read the same PDF." },
      {
        property: "og:description",
        content: "Read once. Answer everywhere the file goes.",
      },
    ],
  }),
});

const SNIPPET = `import { readManifest } from "pdf-frontmatter";

const card = await readManifest(bytes);
if (card.manifest) console.log(card.manifest.title);`;

function Home() {
  return (
    <SiteShell>
      <Folio className="pt-10 sm:pt-12">
        <h1 className="max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl">
          Stop paying AI to re-read the same PDF.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          A 1 KB card inside the file carries what the document is and where
          things live. Written once; tools that look for the card skip the parse
          and answer in milliseconds.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
        <p className="mt-3 text-sm text-muted">Free · no account · nothing stored</p>
      </Folio>

      <Folio className="mt-8 sm:mt-10">
        <TheRace />
      </Folio>

      <Folio className="mt-10">
        <SavingsCalculator />
      </Folio>

      <Folio roman="i" className="mt-20">
        <h2 className="font-display text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            {
              n: "i",
              t: "We read your PDF once.",
              d: "In your browser. The file does not leave your machine until you ask a model to draft the card — and then only the extracted text is sent.",
            },
            {
              n: "ii",
              t: "We write a one-page card.",
              d: "What it is, what’s where, who is named. About 40 words and a map of sections to page numbers.",
            },
            {
              n: "iii",
              t: "We put the card inside the file.",
              d: "Invisible, standard, under 1 KB. A normal PDF attachment. Acrobat has shown these since 2001.",
            },
          ].map((step) => (
            <li key={step.n} className="border-t border-rule pt-4">
              <p className="text-xs tracking-[0.18em] text-oxblood uppercase">{step.n}</p>
              <h3 className="mt-2 font-display text-xl">{step.t}</h3>
              <p className="mt-2 text-sm text-ink-soft">{step.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-2xl text-sm text-muted">
          Preview on a Mac will not list the attachment. Acrobat will. So will
          any tool that looks for <code className="font-mono text-xs">agent-frontmatter.yaml</code>.
          Tools that don’t look still get a normal PDF.
        </p>
      </Folio>

      <Folio roman="ii" className="mt-20">
        <h2 className="font-display text-3xl sm:text-4xl">Who it’s for</h2>
        <div className="mt-8 grid min-w-0 gap-4 lg:grid-cols-3">
          <Audience
            kicker="You build AI tools"
            title="Stop paying the full parse on every touch."
            body="Five lines to read the card. If it is missing or stale, fall back. The libraries are MIT."
            href="/spec"
            cta="Open the spec"
            code={SNIPPET}
          />
          <Audience
            kicker="You run an archive"
            title="Understand each document once."
            body="Legal, insurance, accounting, public sector. Thousands of PDFs feeding models. Pay the write once; every later read is the card."
            href="#waitlist"
            cta="Join the batch list"
          />
          <Audience
            kicker="You have PDFs"
            title="Try it on one file. Free."
            body="You get the same PDF back with a 1 KB card inside. Useful as a human summary today. Ready for any tool that learns to look."
            href="/app"
            cta="Try it on a PDF"
          />
        </div>
      </Folio>

      <Folio className="mt-20">
        <div className="border border-rule bg-folio px-5 py-8 sm:px-8">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">Open</p>
          <h2 className="mt-2 font-display text-3xl">A convention, CC0. Code, MIT.</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink-soft">
            TypeScript and Python libraries in the repo. Complementary to{" "}
            <a href="https://doclang.ai" rel="noreferrer">
              DocLang
            </a>
            : that project describes what a machine-readable document looks like.
            This one says where that data lives so it cannot be orphaned.
          </p>
          <a
            href="https://github.com/reisierx/pdf-frontmatter"
            className="mt-5 inline-block text-sm"
          >
            github.com/reisierx/pdf-frontmatter
          </a>
        </div>
      </Folio>

      <Folio className="mt-20" roman="iii">
        <div id="waitlist">
          <h2 className="font-display text-3xl sm:text-4xl">
            Coming: batch enrichment for whole archives
          </h2>
          <p className="mt-3 max-w-xl text-ink-soft">
            Point it at a folder. Get every PDF back with a card. We store the
            email and nothing else.
          </p>
          <WaitlistForm />
        </div>
      </Folio>
    </SiteShell>
  );
}

function Audience({
  kicker,
  title,
  body,
  href,
  cta,
  code,
}: {
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  code?: string;
}) {
  const inner = (
    <>
      <p className="text-xs tracking-[0.16em] text-oxblood uppercase">{kicker}</p>
      <h3 className="mt-2 font-display text-xl">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-ink-soft">{body}</p>
      {code ? (
        <pre className="mt-4 w-full max-w-full overflow-x-auto bg-ink p-3 text-[0.7rem] leading-relaxed text-paper">
          {code}
        </pre>
      ) : null}
      <span className="mt-4 text-sm text-oxblood">{cta}</span>
    </>
  );

  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        className="flex min-w-0 flex-col border border-rule bg-folio p-5 text-ink no-underline hover:border-ink"
      >
        {inner}
      </a>
    );
  }
  if (href.startsWith("http")) {
    return (
      <a
        href={href}
        className="flex min-w-0 flex-col border border-rule bg-folio p-5 text-ink no-underline hover:border-ink"
      >
        {inner}
      </a>
    );
  }
  return (
    <Link
      to={href}
      className="flex min-w-0 flex-col border border-rule bg-folio p-5 text-ink no-underline hover:border-ink"
    >
      {inner}
    </Link>
  );
}
