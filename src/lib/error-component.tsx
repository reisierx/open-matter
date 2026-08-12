import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-6 text-center text-ink">
      <span className="text-oxblood" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={1.5} />
      </span>
      <h1 className="font-display text-lg font-medium">This page caught on a fold</h1>
      <p className="max-w-md text-sm text-pretty text-muted">
        {error.message || "An unexpected error occurred. Reload the page, or go back and try again."}
      </p>
    </main>
  );
}
