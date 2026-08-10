import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/self-optimize")({
  loader: async () => ({}),
  component: () => null,
});
