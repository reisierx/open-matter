import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/quickstart")({
  beforeLoad: () => {
    throw redirect({ to: "/spec", hash: "install" });
  },
});
