import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/healthz")({
  loader: async () => ({}),
  component: () => null,
});
