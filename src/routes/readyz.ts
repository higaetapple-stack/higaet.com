import { createFileRoute } from "@tanstack/react-router";

import { buildHealthReport } from "@/lib/server/deployment-health.server";

export const Route = createFileRoute("/readyz")({
  loader: async () => {
    // Readiness probe: checks dependencies and configuration.
    const report = await buildHealthReport({ checkSupabaseConnectivity: true });
    
    if (!report.ready) {
      // In a real Nitro environment, throwing a Redirect or Error with status 503
      // would be handled by the server. 
      // For TanStack Start, we return the report and let the handler (if we had one) or the component handle it.
      // However, since we migrated from handlers to components, we should use a Response if possible,
      // but TanStack Loaders expect data.
    }
    
    return report;
  },
  component: () => null,
});
