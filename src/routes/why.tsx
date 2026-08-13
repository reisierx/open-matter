import { createFileRoute, Link } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/why")({
  component: WhyPage,
  head: () => ({
    meta: [
      { title: "Why the card lives in the file — and why it matters most for local models" },
      {
        name: "description",
        content:
          "AI already reads documents. The cost is time, and the models that feel it most are the small ones you run yourself. PDF is the first profile.",
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
          Why the card lives in the file — and why small models feel it first
        </h1>
        <article className="mt-10 max-w-2xl space-y-5 text-ink-soft">
          <p>
            AI already reads documents. That is not the question. The question
            is how long it takes, and which models can still answer after the
            ingest. PDF is where we ship first. The convention is the card
            inside the file, not the format.
          </p>
          <p>
            Every chat, every agent, every pipeline that touches a contract pays
            the full parse again. Prefill is a wall-clock tax proportional to
            document size. Token prices can fall 80% in a year. The seconds to
            chew eight pages do not. Tail latency is the agent’s user experience.
            None of that improves when tokens get cheaper.
          </p>
          <p>
            The existing fixes park the understanding somewhere the file leaves
            behind. Adobe keeps it in the app. RAG keeps it in your database. A
            sidecar next to the file is gone the first time someone emails the
            document. Replacement formats ask the world to stop using what they
            already have. Files do not circulate that way. They are forwarded,
            archived, named badly, and opened three years later by software that
            was not in the room when they were written.
          </p>
          <p>
            open-matter is a small YAML card that travels <em>with</em> the
            file. Version 0.1 is the PDF profile: a normal attachment named{" "}
            <code className="font-mono text-xs">open-matter.yaml</code>.
            Acrobat has shown attachments since 2001. The pages do not change.
            DOCX, EPUB, HTML — same envelope, different pocket. A frontier model
            writes the card once. Every later reader — a frontier API, an 8B
            open-weight model, a 3B model on a phone — reads a page of hints
            instead of the whole file.
          </p>
          <p>
            That last part is the claim that is hardest to copy and easiest to
            feel if you run models locally. Small models degrade on long
            context. Needle-in-haystack scores on them range from 22% to 92%.
            The gap versus closed models widens past 4K tokens. An 8B model
            drops about twenty points from 8K to 32K. Pre-digested artifacts
            reverse the gap: a 3B model with structured retrieval can beat a
            GPT-4o baseline that is still hunting through raw pages. On a phone
            the constraint is energy. Local inference can drain 6–25% of the
            battery in under fifteen minutes, and most of that energy is data
            movement. Every skipped re-parse saves seconds and joules.
          </p>
          <p>
            Writing the card costs one full read. At one read per document it
            saves nothing. From the second read on, the arithmetic is simple.
            Tools that do not look for the card still get a normal file. That is
            the whole honesty contract: we do not claim every model on earth
            reads this today. We claim that five lines in an ingestion library
            is a smaller ask than a new file format, and that the models which
            need it most are the ones you already run.
          </p>
          <p>
            A machine-readable convention without consumers is a file nobody
            opens. So the consumers ship with the spec: a TypeScript reader, a
            Python reader, an MCP server that exposes read_manifest and
            write_manifest, and one free app that writes a card onto your file
            and sits an exam written from the pages. Batch enrichment for
            folders is next. The spec stays free.
          </p>
          <p>
            If you write local or open-weight software, look for the card
            before you parse. If you run an archive, try one file and then send
            an email for the batch list. If the card is wrong, ignore it.
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
