import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { FrontmatterApp } from "@/components/frontmatter-app";

export const Route = createFileRoute("/app")({
  component: AppPage,
  head: () => ({
    meta: [
      { title: "Try it on a PDF — open-matter" },
      {
        name: "description",
        content:
          "Drop a PDF. You get the same file back with a 1 KB card inside. Free, no account, nothing stored.",
      },
    ],
  }),
});

function AppPage() {
  return (
    <SiteShell compact hideFooter>
      <FrontmatterApp />
    </SiteShell>
  );
}
