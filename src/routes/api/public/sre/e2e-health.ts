/**
 * Public health-check for the SRE E2E trigger.
 *
 * External uptime monitors can hit this to verify the trigger endpoint
 * is properly configured WITHOUT needing the bearer secret. Never
 * returns any secret value — only presence booleans.
 *
 * Response contract:
 *   200 { status: "ok",       sreConfigured: true  }
 *   503 { status: "degraded", sreConfigured: false }
 *
 * Production monitoring should alert on this endpoint returning 503.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/sre/e2e-health")({
  server: {
    handlers: {
      GET: async () => {
        const sreConfigured = Boolean(process.env.SRE_E2E_TRIGGER_SECRET);
        const githubConfigured = Boolean(
          process.env.GITHUB_TOKEN && process.env.GITHUB_REPO?.includes("/"),
        );
        const payload = {
          status: sreConfigured ? "ok" : "degraded",
          sreConfigured,
          githubConfigured,
          timestamp: new Date().toISOString(),
        };
        console.log(
          JSON.stringify({
            evt: "sre_trigger_health",
            configured: sreConfigured,
            githubConfigured,
            timestamp: payload.timestamp,
          }),
        );
        return Response.json(payload, { status: sreConfigured ? 200 : 503 });
      },
    },
  },
});
