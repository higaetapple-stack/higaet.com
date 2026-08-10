import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/governance/knowledge")({
  loader: async () => ({}),
  component: () => null,
});
