import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/universities")({
  loader: async () => ({}),
  component: () => null,
});
