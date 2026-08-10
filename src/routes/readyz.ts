import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/readyz")({
  loader: async () => ({}),
  component: () => null,
});
