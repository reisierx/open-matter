import { createFileRoute, Link } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";
import { TheRace } from "@/components/the-race";
import { SavingsCalculator } from "@/components/savings-calculator";
import { FileFlip } from "@/components/file-flip";
import { WaitlistForm } from "@/components/waitlist-form";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "open-matter — stop making AI re-read the same file" },
      {
        name: "description",
        content:
          "A 1 KB card written on a read you were already doing. It stays inside the file. PDF first.",
      },
      { property: "og:title", content: "Stop making AI re-read the same file." },
      {
        property: "og:description",
        content: "Read it once. Every model benefits forever.",
      },
    ],
  }),
});

function Home() {
  return (
    <SiteShell>
      <Folio className="pt-10 sm:pt-12">
        <h1 className="max-w-3xl text-balance font-display text-4xl leading-[1.1] sm:text-5xl">
          Stop making AI re-read the same <FileFlip />
        </h1>
        <p className="lede mt-4 max-w-2xl text-lg">
          The card is written on a read you were already doing. It stays
          inside the file: what it is, the facts that matter, where to look.
          The next model skips the parse. PDF first.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/app"
            className="inline-flex h-11 items-center justify-center border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink no-underline hover:bg-oxblood-deep hover:text-oxblood-ink"
          >
            Try it on a .pdf
          </Link>
          <Link
            to="/spec"
            className="inline-flex h-11 items-center justify-center border border-rule px-5 text-sm text-ink no-underline hover:border-ink"
          >
            Read the spec
          </Link>
        </div>
        <p className="mt-3 text-sm text-muted">
          Free · no account · nothing stored · spec CC0
        </p>
      </Folio>

      <Folio className="mt-10">
        <TheRace />
      </Folio>

      <Folio className="pt-16 sm:pt-20">
        <p className="kicker">How it works</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl leading-[1.15] sm:text-4xl">
          A document should only have to be understood once.
        </h2>
        <p className="lede">
          Every time someone asks an AI about a file, the model starts from
          nothing. You wait. You pay. The next person does the same work to
          the same file — which has not changed. The understanding never
          travels with it.
        </p>
        <ol className="mt-10 max-w-3xl">
          {[
            {
              n: "i",
              title: "Your agent was going to read it anyway",
              body: "On the way out it writes a small card: what this file is, the facts that matter, which page they live on. Marginal cost: a few hundred tokens. Not a second paid parse.",
            },
            {
              n: "ii",
              title: "We check the card against the pages",
              body: "The questions come from the document, not from the card. If a number is wrong or missing, we rewrite. A card that fails is not attached.",
            },
            {
              n: "iii",
              title: "You get the same file back",
              body: "Nothing on the page looks different. The next model — Claude, Grok, something on a laptop — opens the card first, then only the page it needs.",
            },
          ].map((s) => (
            <li
              key={s.n}
              className="grid gap-1 border-t border-rule py-5 sm:grid-cols-[2.5rem_1fr] sm:gap-6"
            >
              <p className="font-display text-lg text-oxblood">{s.n}</p>
              <div>
                <h3 className="font-display text-xl">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Folio>

      <Folio className="pt-16 sm:pt-20">
        <p className="kicker">What the card enables</p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">
          Not a cache. A layer other software can trust.
        </h2>
        <p className="lede">
          The same pattern as ID3, EXIF, and package.json: a tiny embedded map.
        </p>
        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          <Enable
            title="Small models can finish the job"
            lead="Write the card once with a frontier model."
            body="A 3B model given that card has beaten a frontier model still hunting through raw pages."
            proof="Lost in the Middle · SLM survey · DeRetSyn"
          />
          <Enable
            title="Open the right page first"
            lead="Filter before you guess."
            body="Metadata-filtered retrieval lifts precision by about 15%, and quality nearly 2×. The card is that filter."
            proof="Deasy Labs · Two-Step RAG"
          />
          <Enable
            title="Decide before you load"
            lead="One kilobyte to know whether to open the file."
            body="Claude Skills route on ~100-token descriptions. Eight skills cost ~500 tokens at startup instead of 70,000."
            proof="SKILL.md / AGENTS.md"
          />
          <Enable
            title="Know when memory is stale"
            lead="A content hash is cache-validity for agents."
            body="If the pages changed, the understanding is void. Signed cards are next."
            proof="Mem0 staleness · C2PA 2.3"
          />
          <Enable
            title="A folder becomes a graph"
            lead="Entities and sections, already named."
            body="The expensive GraphRAG step ships pre-computed. Documents as nodes, shared names as edges."
            proof="Coming — exploration, not guaranteed truth"
          />
        </div>
        <p className="mt-8 text-sm text-muted">
          Sources, cited on the{" "}
          <Link to="/spec" hash="faq">
            spec FAQ
          </Link>{" "}
          and in the <Link to="/why">essay</Link>.
        </p>
      </Folio>

      <Folio className="pt-16 sm:pt-20">
        <p className="kicker">Who it’s for</p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">Three desks. Same card.</h2>
        <p className="lede">
          The file leaves the building. The understanding has to leave with it.
        </p>
        <div className="mt-10 grid gap-x-10 gap-y-8 lg:grid-cols-3">
          <Audience
            kicker="You write agents"
            title="Stop handing your agent the haystack."
            body="Claude, Codex, Cursor, Grok already load skills. Drop ours in. The agent opens the card, then one page."
            href="#install"
            cta="Install for Claude"
          />
          <Audience
            kicker="You issue the file"
            title="Mark it for other people’s machines."
            body="You wrote it. You card it. Same shape as schema.org. Readers who want the digest can take it. Readers who don’t still have a normal file."
            href="/spec"
            cta="Read the spec"
          />
          <Audience
            kicker="You run small models"
            title="A 3B can finish what the 70B was hired to start."
            body="Frontier writes the digest. Your on-device stack answers from it."
            href="/why"
            cta="Why this matters locally"
          />
        </div>
      </Folio>

      <Folio className="pt-16 sm:pt-20">
        <div id="install">
          <p className="kicker">Install</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            A Claude plugin. Skills and MCP if you want the pieces.
          </h2>
          <p className="lede">
            Claude first — skill plus hands in one install. The same folders
            work in Cursor, Codex, Grok, and Copilot.
          </p>
          <ul className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            {[
              { name: "Claude", src: "/marks/claude.svg" },
              { name: "ChatGPT", src: "/marks/openai.svg" },
              { name: "Cursor", src: "/marks/cursor.svg" },
              { name: "Grok", src: "/marks/grok.svg" },
              { name: "Copilot", src: "/marks/copilot.svg" },
            ].map((m) => (
              <li key={m.name} className="flex items-center gap-2">
                <img src={m.src} alt="" width={22} height={22} className="h-5 w-5" />
                <span className="text-sm">{m.name}</span>
              </li>
            ))}
          </ul>
          <pre className="mt-8 overflow-x-auto bg-ink p-4 text-[0.7rem] leading-relaxed text-paper">
            {`/plugin marketplace add reisierx/open-matter
/plugin install open-matter@open-matter`}
          </pre>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="https://github.com/reisierx/open-matter/tree/main/plugins/open-matter"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center border border-oxblood bg-oxblood px-5 text-sm text-oxblood-ink no-underline hover:bg-oxblood-deep hover:text-oxblood-ink"
            >
              Claude plugin
            </a>
            <a
              href="https://github.com/reisierx/open-matter/tree/main/skills"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center border border-rule px-5 text-sm text-ink no-underline hover:border-ink"
            >
              Skills
            </a>
            <Link to="/spec" hash="install" className="inline-flex h-11 items-center text-sm">
              Spec and libraries
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted">
            Spec CC0 · code MIT ·{" "}
            <a href="https://github.com/reisierx/open-matter" target="_blank" rel="noreferrer">
              github.com/reisierx/open-matter
            </a>
          </p>
        </div>
      </Folio>

      <Folio className="pt-16 sm:pt-20">
        <div id="waitlist">
          <p className="kicker">Later</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            Cards on files you are already ingesting
          </h2>
          <p className="lede">
            Not a prepaid pass over a cold archive. If you already run a
            pipeline, the card can be exhaust there too. Leave an email.
          </p>
          <WaitlistForm />
        </div>
      </Folio>

      <Folio className="pt-16 sm:pt-20 pb-8">
        <SavingsCalculator />
      </Folio>
    </SiteShell>
  );
}

function Enable({
  title,
  lead,
  body,
  proof,
}: {
  title: string;
  lead: string;
  body: string;
  proof: string;
}) {
  return (
    <div className="border-t border-rule pt-4">
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-ink-soft">
        <strong className="font-medium text-ink">{lead}</strong> {body}
      </p>
      <p className="mt-2 text-sm italic text-muted">{proof}</p>
    </div>
  );
}

function Audience({
  kicker,
  title,
  body,
  href,
  cta,
}: {
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  const inner = (
    <>
      <p className="kicker">{kicker}</p>
      <h3 className="mt-2 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-ink-soft">{body}</p>
      <span className="mt-3 inline-block text-sm text-oxblood">{cta}</span>
    </>
  );

  if (href.startsWith("#") || href.startsWith("http")) {
    return (
      <a href={href} className="block border-t border-rule pt-4 text-ink no-underline">
        {inner}
      </a>
    );
  }
  return (
    <Link to={href} className="block border-t border-rule pt-4 text-ink no-underline">
      {inner}
    </Link>
  );
}
