import { createFileRoute } from "@tanstack/react-router";
import { Folio, SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: "Privacy — pdf-frontmatter" }],
  }),
});

function PrivacyPage() {
  return (
    <SiteShell>
      <Folio roman="privacy" className="pt-12 sm:pt-16">
        <h1 className="font-display text-4xl">What we see. What we do not.</h1>
        <div className="mt-8 max-w-2xl space-y-4 text-ink-soft">
          <p>
            The app does not create an account. It does not keep the PDF. It
            does not keep the extracted text. It does not keep the card after
            you download.
          </p>
          <p>
            The file is opened in your browser. If you ask a model to write a
            card, the extracted text — not the file — is sent to a language
            model on the server and discarded with the request. The API key
            stays on the server.
          </p>
          <p>
            The waitlist stores an email address and the time it was added.
            Nothing else.
          </p>
          <p>
            A public counter stores how many cards were bound and an estimate
            of tokens not spent. It does not store filenames, hashes of
            documents, or any document content.
          </p>
          <p>There is no advertising SDK and no document analytics.</p>
        </div>
      </Folio>
    </SiteShell>
  );
}
