import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/vector-search")({
  loader: async () => ({}),
  component: () => null,
});
