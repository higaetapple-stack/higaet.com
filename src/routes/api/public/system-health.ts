import { createFileRoute } from "@tanstack/react-router";
import { buildSystemSnapshot } from "@/lib/observability/snapshot";
import { aggregateHealth } from "@/lib/observability/aggregator";

export const Route = createFileRoute("/api/public/system-health")({
  server: {
    handlers: {
      GET: async () => {
        const snapshot = buildSystemSnapshot();
        const aggregate = aggregateHealth(snapshot);
        return Response.json({ snapshot, aggregate });
      },
    },
  },
});
