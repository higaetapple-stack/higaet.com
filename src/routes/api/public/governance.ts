import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/governance")({
  loader: async () => ({}),
  component: () => null,
});
