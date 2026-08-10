import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/strategy")({
  loader: async () => ({}),
  component: () => null,
});
