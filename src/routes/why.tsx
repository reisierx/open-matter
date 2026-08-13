import { createFileRoute, Link } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/why")({
  component: WhyPage,
  head: () => ({
    meta: [
      { title: "Why PDFs need frontmatter" },
      {
        name: "description",
        content:
          "AI already reads PDFs. It just does it the expensive way, every time, and throws the understanding away.",
      },
    ],
  }),
});

function WhyPage() {
  return (
    <SiteShell>
      <Folio className="pt-12 sm:pt-16">
        <p className="text-sm tracking-[0.16em] text-muted uppercase">13 August 2026 · Lisboa</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl sm:text-5xl">
          Why PDFs need frontmatter
        </h1>
        <article className="mt-10 max-w-2xl space-y-5 text-ink-soft">
          <p>
            AI already reads PDFs. That is not the question. The question is what
            it costs, and what happens to the understanding when the read is over.
          </p>
          <p>
            Every chat, every agent, every pipeline that touches a contract pays
            the full parse again. Eight pages become two thousand tokens. A
            hundred-page report becomes twenty thousand. Then the answer is used
            and the understanding is thrown away. Forward the file. Download it.
            Open it in another tool. The next model starts from zero.
          </p>
          <p>
            The existing fixes all park that understanding somewhere the file
            leaves behind. Adobe keeps it in the app. RAG keeps it in your
            database. A sidecar <code className="font-mono text-xs">.yaml</code>{" "}
            next to the PDF is gone the first time someone emails the document.
            Replacement formats ask the world to stop using PDF. None of that is
            how files actually circulate.
          </p>
          <p>
            Files circulate as attachments. They are forwarded, archived, named
            badly, and opened three years later by software that was not in the
            room when they were written. If the understanding does not travel
            inside that file, it is not the file’s understanding. It is a note
            in someone else’s system.
          </p>
          <p>
            pdf-frontmatter is a 1 KB YAML card stored as a normal PDF
            attachment named <code className="font-mono text-xs">agent-frontmatter.yaml</code>.
            Acrobat has shown attachments since 2001. The pages do not change.
            The file remains a valid PDF. The card says what the document is,
            where the sections live, and who is named. Tools that look for it
            skip the parse and answer in milliseconds. Tools that do not look
            still get a normal PDF.
          </p>
          <p>
            Writing the card costs one full read. At one read per document it
            saves nothing. From the second read on, the arithmetic is simple.
            On the sample contract in this site the card is about a tenth of the
            tokens and about a tenth of the time. On an archive of a thousand
            files read twenty times a year, that is not a rounding error. It is
            the difference between paying for the same parse over and over and
            paying for it once.
          </p>
          <p>
            This is not a claim that every model on earth reads the card today.
            They do not. The libraries are how a stack starts looking: five
            lines in TypeScript, a fallback if the card is missing or stale, and
            a rule that a lying card must only ever cost a slow read, never a
            wrong answer. The MCP server is the same idea for agents. The
            convention is CC0 so nobody has to ask.
          </p>
          <p>
            I built the first public text in Lisboa in August 2026 because I was
            tired of watching models chew the same agreements. The site is the
            spec, the libraries, and one free app that writes a card onto a
            single file. Batch enrichment for whole archives is next. The spec
            will stay free.
          </p>
          <p>
            If you write ingestion software, look for the card before you parse.
            If you run an archive, try one file and then send an email for the
            batch list. If the card is wrong, ignore it. That is the whole
            contract.
          </p>
          <p>
            <Link to="/app">Try it on a PDF</Link>
            {" · "}
            <Link to="/spec">Read the spec</Link>
          </p>
        </article>
      </Folio>
    </SiteShell>
  );
}
