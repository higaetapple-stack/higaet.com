import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/ci-audit/ingest")({
  loader: async () => ({}),
  component: () => null,
});
