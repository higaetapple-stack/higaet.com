import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/sre/verify-bearer")({
  loader: async () => ({}),
  component: () => null,
});
