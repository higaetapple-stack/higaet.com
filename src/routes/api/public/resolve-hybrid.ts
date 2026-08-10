import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/resolve-hybrid")({
  loader: async () => ({}),
  component: () => null,
});
