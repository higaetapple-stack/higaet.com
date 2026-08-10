import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/sentry/sync")({
  loader: async () => ({}),
  component: () => null,
});
