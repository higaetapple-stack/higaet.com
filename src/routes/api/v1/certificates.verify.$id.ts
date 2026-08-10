import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/certificates/verify/$id")({
  loader: async () => ({}),
  component: () => null,
});
