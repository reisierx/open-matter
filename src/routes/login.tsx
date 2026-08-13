import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — pdf-frontmatter" }] }),
});

function Login() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-sm px-4 py-20">
        <h1 className="font-display text-3xl">Sign in</h1>
        <p className="mt-3 text-sm text-muted">
          The app does not need an account. Sign-in is only here if you want a
          session on this site.
        </p>
        <div className="mt-6 space-y-3">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="h-11 w-full border border-rule bg-folio px-4 text-sm hover:border-ink"
              >
                Continue with {p.label}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
        <p className="mt-6 text-sm">
          <Link to="/">Back</Link>
        </p>
      </main>
    </SiteShell>
  );
}
