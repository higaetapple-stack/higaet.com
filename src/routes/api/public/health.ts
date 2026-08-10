import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { buildHealthReport } from "@/lib/server/deployment-health.server";

const getSystemHealth = createServerFn({ method: "GET" })
  .handler(async () => {
    // API-style health check for public systems
    return await buildHealthReport({ checkSupabaseConnectivity: true });
  });

export const Route = createFileRoute("/api/public/health")({
  loader: async () => {
    return await getSystemHealth();
  },
  component: () => null,
});