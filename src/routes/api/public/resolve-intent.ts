import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/resolve-intent")({
  loader: async () => ({}),
  component: () => null,
});
