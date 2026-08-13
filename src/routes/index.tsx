import { createFileRoute, Link } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";
import { TheRace } from "@/components/the-race";
import { SavingsCalculator } from "@/components/savings-calculator";
import { WaitlistForm } from "@/components/waitlist-form";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "pdf-frontmatter — stop making AI re-read the same PDF" },
      {
        name: "description",
        content:
          "A 1 KB card inside the file. A frontier model writes it once; every agent, and every small local model, reads it in milliseconds.",
      },
      { property: "og:title", content: "Stop making AI re-read the same PDF." },
      {
        property: "og:description",
        content: "Read it once. Every model benefits forever.",
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
          Stop making AI re-read the same PDF.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          A 1 KB card inside the file carries what the document is and where
          things live. A frontier model writes it once; every agent, and every
          small local model, reads it in milliseconds.
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
        <p className="mt-3 text-sm text-muted">
          Free · no account · nothing stored · open standard, spec CC0
        </p>
      </Folio>

      <Folio className="mt-8 sm:mt-10">
        <TheRace />
      </Folio>

      <Folio className="mt-10">
        <SavingsCalculator />
      </Folio>

      <Folio className="mt-20">
        <p className="text-xs tracking-[0.18em] text-oxblood uppercase">Works with local models</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">
          Write the card once with a frontier model. Your on-device models read it forever.
        </h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-3">
          <li className="border-t border-rule pt-4">
            <h3 className="font-display text-xl">Small models fail on long documents</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Needle-in-haystack accuracy on small models ranges from 22% to 92%.
              The gap vs closed models widens past 4K tokens. An 8B model drops
              about 20 points from 8K to 32K context.
            </p>
          </li>
          <li className="border-t border-rule pt-4">
            <h3 className="font-display text-xl">A card written once fixes that</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Pre-digested artifacts reverse the gap. A 1 KB card is the section
              map and the entities — the thing a 3B model can actually hold.
            </p>
          </li>
          <li className="border-t border-rule pt-4">
            <h3 className="font-display text-xl">On a phone, it also saves battery</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Local inference can drain 6–25% of a phone battery in under 15
              minutes. Most of that energy is data movement. Every skipped
              re-parse saves seconds and joules.
            </p>
          </li>
        </ul>
        <p className="mt-5 text-sm text-muted">
          Sources, cited on the{" "}
          <Link to="/spec" hash="faq">
            spec FAQ
          </Link>
          . Consume a card from any local stack:
        </p>
        <pre className="mt-3 max-w-full overflow-x-auto bg-ink p-3 text-[0.7rem] leading-relaxed text-paper">
          {`npx mcp-pdf-frontmatter   # read_manifest / write_manifest`}
        </pre>
      </Folio>

      <Folio roman="i" className="mt-20">
        <h2 className="font-display text-3xl sm:text-4xl">What the card enables</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Enable
            title="Capability transfer"
            body="Write the card once with a frontier model; your on-device and open-weight models read it forever."
          />
          <Enable
            title="Precise retrieval"
            body="Filter to the right document and the right page before spending a token guessing."
          />
          <Enable
            title="Progressive disclosure"
            body="Agents read a 1 KB card to decide what to open — the same pattern Claude Skills use."
          />
          <Enable
            title="Staleness hash"
            body="A content hash tells any agent instantly whether its cached understanding is still valid."
          />
          <Enable
            title="Point it at a folder, get a graph"
            body="Documents as nodes, shared entities as edges. Coming. Exploration, not guaranteed truth."
            coming
          />
        </div>
      </Folio>

      <Folio roman="ii" className="mt-20">
        <h2 className="font-display text-3xl sm:text-4xl">Who it’s for</h2>
        <div className="mt-8 grid min-w-0 gap-4 lg:grid-cols-3">
          <Audience
            kicker="You build AI tools"
            title="Documents your small models can finally handle."
            body="Five lines to read the card. If it is missing or stale, fall back. The libraries are MIT. The MCP server is in the repo."
            href="/spec"
            cta="Open the spec"
            code={SNIPPET}
          />
          <Audience
            kicker="You run an archive"
            title="Understand each document once."
            body="Legal, insurance, accounting, public sector. Pay the write once. Later reads are the card — and a graph of the whole folder is next."
            href="#waitlist"
            cta="Join the batch list"
          />
          <Audience
            kicker="You have PDFs"
            title="Race it on your own file."
            body="Drop one PDF. Ask it a question. See the card side finish first. Free."
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
            TypeScript, Python, and an MCP server in the repo. Complementary to{" "}
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

function Enable({ title, body, coming }: { title: string; body: string; coming?: boolean }) {
  return (
    <div className="border border-rule bg-folio p-5">
      {coming ? (
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Coming</p>
      ) : null}
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-ink-soft">{body}</p>
    </div>
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

  if (href.startsWith("#") || href.startsWith("http")) {
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
