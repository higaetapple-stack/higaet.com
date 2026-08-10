import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/programs")({
  loader: async () => ({}),
  component: () => null,
});
