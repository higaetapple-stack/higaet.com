import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/webhook-dispatch")({
  loader: async () => ({}),
  component: () => null,
});
