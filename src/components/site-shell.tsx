import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/spec" as const, label: "Spec" },
  { to: "/quickstart" as const, label: "Quickstart" },
  { to: "/faq" as const, label: "FAQ" },
];

export function SiteHeader({ brand = "standard" }: { brand?: "standard" | "prefacio" }) {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-4 sm:px-6">
        <Link
          to={brand === "prefacio" ? "/app" : "/"}
          className="min-w-0 text-ink no-underline hover:text-ink"
        >
          <span className="block font-display text-lg leading-none tracking-tight sm:text-xl">
            {brand === "prefacio" ? "Prefácio" : "pdf-frontmatter"}
          </span>
          <span className="mt-1 block font-serif text-[0.7rem] tracking-[0.14em] text-muted uppercase">
            {brand === "prefacio" ? "a preface for the machine" : "0.1  ·  the carrier"}
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-2 py-2 text-sm text-ink-soft no-underline hover:text-oxblood ${
                item.to === "/quickstart" ? "hidden sm:inline" : ""
              }`}
              activeProps={{ className: "px-2 py-2 text-sm text-oxblood no-underline" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/app"
            className="border border-oxblood bg-oxblood px-3 py-2 text-sm text-oxblood-ink no-underline hover:bg-oxblood-deep hover:text-oxblood-ink"
          >
            Prefácio
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-rule">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-[1.2fr_1fr] sm:px-6">
        <div>
          <p className="font-display text-lg">Colophon</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            pdf-frontmatter is an open convention (spec CC0, code MIT). Prefácio is
            the app that writes the card. They share this press but not a name.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <Link to="/spec" className="text-ink-soft no-underline hover:text-oxblood">
              Specification
            </Link>
            <Link to="/quickstart" className="text-ink-soft no-underline hover:text-oxblood">
              Quickstart
            </Link>
            <Link to="/faq" className="text-ink-soft no-underline hover:text-oxblood">
              FAQ
            </Link>
            <a
              href="https://github.com/pdf-frontmatter/pdf-frontmatter"
              className="text-ink-soft no-underline hover:text-oxblood"
            >
              GitHub
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <Link to="/app" className="text-ink-soft no-underline hover:text-oxblood">
              Prefácio
            </Link>
            <Link to="/privacy" className="text-ink-soft no-underline hover:text-oxblood">
              Privacy
            </Link>
            <a href="/llms.txt" className="text-ink-soft no-underline hover:text-oxblood">
              llms.txt
            </a>
            <Link to="/login" className="text-ink-soft no-underline hover:text-oxblood">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({
  children,
  brand,
}: {
  children: ReactNode;
  brand?: "standard" | "prefacio";
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader brand={brand} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

export function Folio({
  roman,
  children,
  className = "",
}: {
  roman?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto w-full min-w-0 max-w-5xl px-4 sm:px-6 ${className}`}>
      {roman ? (
        <p className="mb-3 font-display text-sm tracking-[0.22em] text-oxblood uppercase">
          {roman}
        </p>
      ) : null}
      {children}
    </section>
  );
}
