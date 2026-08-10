import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/constitution/apply")({
  loader: async () => ({}),
  component: () => null,
});
