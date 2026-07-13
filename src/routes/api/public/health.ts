import { createFileRoute } from "@tanstack/react-router";
import { rateLimit } from "@/lib/server/rate-limit";

const STARTED_AT = Date.now();

// Staging-only abuse protection. Production is unaffected because the limit
// is only enforced when STAGE === "staging" (set in the staging env only).
const STAGE = process.env.HIGAET_STAGE ?? "";
const HEALTH_RL = {
  name: "healthz",
  limit: Number(process.env.HEALTH_RL_LIMIT ?? 60),
  windowMs: Number(process.env.HEALTH_RL_WINDOW_MS ?? 60_000),
};

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (STAGE === "staging") {
          const limited = rateLimit(request, HEALTH_RL);
          if (limited) return limited;
        }
        const correlationId =
          request.headers.get("x-correlation-id") ?? crypto.randomUUID();

        // Deep health when ?deep=1 — reports per-dependency status
        // (artifact, env, supabase, port binding). Default keeps the
        // liveness contract (fast, no outbound calls) so uptime probes
        // don't hammer Supabase.
        const url = new URL(request.url);
        const deep = url.searchParams.get("deep") === "1";

        let dependencyStatus: "ok" | "degraded" = "ok";
        let checks: Awaited<
          ReturnType<
            typeof import("@/lib/server/deployment-health.server").buildHealthReport
          >
        >["checks"] | undefined;

        if (deep) {
          const { buildHealthReport } = await import(
            "@/lib/server/deployment-health.server"
          );
          const skipSupabase = process.env.READYZ_SKIP_SUPABASE === "1";
          const report = await buildHealthReport({
            checkSupabaseConnectivity: !skipSupabase,
          });
          checks = report.checks;
          dependencyStatus = report.ready ? "ok" : "degraded";
        }

        const body = {
          status: dependencyStatus,
          service: "higaet-frontend",
          environment: import.meta.env.MODE,
          version: import.meta.env.VITE_APP_VERSION ?? "1.0.0",
          uptimeMs: Date.now() - STARTED_AT,
          timestamp: new Date().toISOString(),
          correlationId,
          ...(checks ? { checks } : {}),
        };
        return new Response(JSON.stringify(body), {
          status: dependencyStatus === "ok" ? 200 : 503,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "x-correlation-id": correlationId,
            "access-control-allow-origin": "*",
          },
        });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "Content-Type, X-Correlation-Id",
            "access-control-max-age": "86400",
          },
        }),
    },
  },
});
