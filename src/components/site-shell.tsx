import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/" as const, label: "Home" },
  { to: "/app" as const, label: "App" },
  { to: "/spec" as const, label: "Spec" },
];

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="shrink-0 border-b border-rule">
      <div
        className={`mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 ${
          compact ? "py-3" : "py-4"
        }`}
      >
        <Link to="/" className="min-w-0 text-ink no-underline hover:text-ink">
          <span className="block font-display text-lg leading-none tracking-tight sm:text-xl">
            open-matter
          </span>
          {!compact ? (
            <span className="mt-1 block font-serif text-[0.7rem] tracking-[0.14em] text-muted uppercase">
              0.1 · an open convention
            </span>
          ) : null}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-2 text-sm text-ink-soft no-underline hover:text-oxblood"
              activeProps={{ className: "px-3 py-2 text-sm text-oxblood no-underline" }}
              activeOptions={item.to === "/" ? { exact: true } : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <p className="max-w-sm font-serif text-sm text-muted">
          An open convention · spec CC0, code MIT · made in Lisboa
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <Link to="/spec" className="text-ink-soft no-underline hover:text-oxblood">
            Spec
          </Link>
          <Link to="/why" className="text-ink-soft no-underline hover:text-oxblood">
            Why
          </Link>
          <a
            href="https://github.com/reisierx/open-matter"
            className="text-ink-soft no-underline hover:text-oxblood"
          >
            GitHub
          </a>
          <Link to="/privacy" className="text-ink-soft no-underline hover:text-oxblood">
            Privacy
          </Link>
          <a href="/llms.txt" className="text-ink-soft no-underline hover:text-oxblood">
            llms.txt
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function SiteShell({
  children,
  compact,
  hideFooter,
}: {
  children: ReactNode;
  compact?: boolean;
  hideFooter?: boolean;
}) {
  return (
    <div className={`flex min-w-0 flex-col ${hideFooter ? "h-dvh overflow-hidden" : "min-h-dvh"}`}>
      <SiteHeader compact={compact} />
      <div className={`flex-1 ${hideFooter ? "min-h-0 overflow-hidden" : ""}`}>{children}</div>
      {hideFooter ? null : <SiteFooter />}
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
