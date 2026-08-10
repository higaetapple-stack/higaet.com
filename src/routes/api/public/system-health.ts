import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/system-health")({
  loader: async () => ({}),
  component: () => null,
});
