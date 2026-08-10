import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/sentry/webhook")({
  loader: async () => ({}),
  component: () => null,
});
