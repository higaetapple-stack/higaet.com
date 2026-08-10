import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/memory-graph")({
  loader: async () => ({}),
  component: () => null,
});
