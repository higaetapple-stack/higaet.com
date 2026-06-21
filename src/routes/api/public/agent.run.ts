import { createFileRoute } from "@tanstack/react-router";
import { stepAgent } from "@/lib/agent/controller";
import type { AgentSession, AgentStep } from "@/lib/agent/types";
import { LIMITS, rateLimit } from "@/lib/server/rate-limit";
import { requireAuthHttp } from "@/lib/server/require-auth-http";
import { withTrace, withTimeout, errorEnvelope } from "@/lib/observability/sentry-server";

export const Route = createFileRoute("/api/public/agent/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAuthHttp(request);
        if (!auth.ok) return auth.response;
        const limited = rateLimit(request, LIMITS.agentRun);
        if (limited) return limited;
        try {
          return await withTrace("agent.run", "ai", async ({ traceId }) => {
            let body: any = {};
            try { body = await request.json(); } catch { body = {}; }
            const goal: string = typeof body.goal === "string" ? body.goal : "untitled";
            const mode: "sandbox" | "strict" = body.mode === "strict" ? "strict" : "sandbox";
            const steps: AgentStep[] = [
              { id: "s1", action: "navigate", route: "/", status: "approved", riskLevel: "low" },
              { id: "s2", action: "navigate", route: "/technologies", status: "approved", riskLevel: "low" },
            ];
            let session: AgentSession = { goal, mode, steps, currentStep: 0 };
            session = await withTimeout(15_000, async () => stepAgent(session), "agent.step");
            return Response.json({
              goal: session.goal,
              mode: session.mode,
              status: "running",
              currentStep: session.currentStep,
              steps: session.steps,
              traceId,
            }, { headers: { "x-trace-id": traceId } });
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "unknown";
          const status = msg.startsWith("timeout:") ? 504 : 500;
          return errorEnvelope({ code: status === 504 ? "timeout" : "agent_run_failed", message: msg, status });
        }
      },
    },
  },
});

