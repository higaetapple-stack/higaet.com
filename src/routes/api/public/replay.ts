import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/replay")({
  loader: async () => ({}),
  component: () => null,
});
