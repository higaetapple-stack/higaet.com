import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/ci-ingest-failures/log")({
  loader: async () => ({}),
  component: () => null,
});
