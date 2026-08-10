import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/shared-memory")({
  loader: async () => ({}),
  component: () => null,
});
