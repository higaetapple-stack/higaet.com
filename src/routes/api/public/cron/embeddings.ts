import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/embeddings")({
  loader: async () => ({}),
  component: () => null,
});
