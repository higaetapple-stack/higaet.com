import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { buildHealthReport } from "@/lib/server/deployment-health.server";

const getReadyReport = createServerFn({ method: "GET" })
  .handler(async () => {
    return await buildHealthReport({ checkSupabaseConnectivity: true });
  });

export const Route = createFileRoute("/readyz")({
  loader: async () => {
    return await getReadyReport();
  },
  component: () => null,
});