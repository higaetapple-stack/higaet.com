import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/process")({
  loader: async () => ({}),
  component: () => null,
});
