import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/poll-pr-ci")({
  loader: async () => ({}),
  component: () => null,
});
