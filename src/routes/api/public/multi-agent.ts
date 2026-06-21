import { createFileRoute } from "@tanstack/react-router";
import { createAgentPlan } from "@/lib/multi-agent/supervisor";
import { runMultiAgentSystem } from "@/lib/multi-agent/orchestrator";
import { aggregateResults } from "@/lib/multi-agent/aggregator";
import { LIMITS, rateLimit } from "@/lib/server/rate-limit";
import { requireAuthHttp } from "@/lib/server/require-auth-http";
import { withTrace, withTimeout, errorEnvelope } from "@/lib/observability/sentry-server";

export const Route = createFileRoute("/api/public/multi-agent")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAuthHttp(request);
        if (!auth.ok) return auth.response;
        const limited = rateLimit(request, LIMITS.multiAgent);
        if (limited) return limited;
        try {
          return await withTrace("multi-agent", "ai", async ({ traceId }) => {
            const url = new URL(request.url);
            const goal = url.searchParams.get("goal") ?? "untitled";
            const { ctx, result } = await withTimeout(20_000, async () => {
              const ctx = runMultiAgentSystem(createAgentPlan(goal));
              return { ctx, result: aggregateResults(ctx) };
            }, "multi-agent.run");
            return Response.json({ ...result, tasks: ctx.tasks, traceId }, {
              headers: { "x-trace-id": traceId },
            });
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "unknown";
          const status = msg.startsWith("timeout:") ? 504 : 500;
          return errorEnvelope({ code: status === 504 ? "timeout" : "multi_agent_failed", message: msg, status });
        }
      },
    },
  },
});

