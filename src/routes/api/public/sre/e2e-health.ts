import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/sre/e2e-health")({
  loader: async () => ({}),
  component: () => null,
});
