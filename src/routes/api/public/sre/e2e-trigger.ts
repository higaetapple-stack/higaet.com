import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/sre/e2e-trigger")({
  loader: async () => ({}),
  component: () => null,
});
