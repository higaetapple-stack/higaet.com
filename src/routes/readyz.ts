import { createFileRoute } from "@tanstack/react-router";

/**
 * Readiness probe. Reports which dependency is failing:
 *   - artifact:      `.output/server/index.mjs` present
 *   - env:           required env vars set
 *   - supabase:      service-role PostgREST reachable + credentials valid
 *   - port_binding:  SSR worker bound to a port
 *
 * Returns 503 with a per-check breakdown when any dependency fails so ops
 * can pinpoint the 503 cause instantly. Set READYZ_SKIP_SUPABASE=1 to
 * skip the outbound Supabase probe (useful for locked-down environments).
 */
export const Route = createFileRoute("/readyz")({
  loader: async () => ({}),
  component: () => null,
});
      GET: async () => {
        const { buildHealthReport } = await import(
          "@/lib/server/deployment-health.server"
        );
        const skipSupabase = process.env.READYZ_SKIP_SUPABASE === "1";
        const report = await buildHealthReport({
          checkSupabaseConnectivity: !skipSupabase,
        });
        const body = {
          status: report.ready ? ("ready" as const) : ("degraded" as const),
          checks: report.checks,
          timestamp: report.timestamp,
        };
        return new Response(JSON.stringify(body, null, 2), {
          status: report.ready ? 200 : 503,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
