import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/decisions")({
  loader: async () => ({}),
  component: () => null,
});
