import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/constitution/status")({
  loader: async () => ({}),
  component: () => null,
});
