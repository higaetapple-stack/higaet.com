import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/healthz")({
  loader: async () => {
    // Liveness probe: if this runs, the process is alive.
    return { status: "ok", timestamp: new Date().toISOString() };
  },
  component: () => null,
});
