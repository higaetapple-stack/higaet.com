import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/constitution/amendments")({
  loader: async () => ({}),
  component: () => null,
});
