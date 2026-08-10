import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/risk/evaluate-pr")({
  loader: async () => ({}),
  component: () => null,
});
