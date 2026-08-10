import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/launch-readiness/ingest")({
  loader: async () => ({}),
  component: () => null,
});
