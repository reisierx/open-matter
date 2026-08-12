import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PrefacioApp } from "@/components/prefacio-app";

export const Route = createFileRoute("/app")({
  component: AppPage,
  head: () => ({
    meta: [
      { title: "Prefácio — bind a card to a PDF" },
      {
        name: "description",
        content: "Drop a PDF. An index card is written and bound inside the file. No account.",
      },
    ],
  }),
});

function AppPage() {
  return (
    <SiteShell brand="prefacio">
      <PrefacioApp />
    </SiteShell>
  );
}
