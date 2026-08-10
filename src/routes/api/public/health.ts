import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  loader: async () => ({}),
  component: () => null,
});
