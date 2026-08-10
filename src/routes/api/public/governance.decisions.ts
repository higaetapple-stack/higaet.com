import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/governance/decisions")({
  loader: async () => ({}),
  component: () => null,
});
