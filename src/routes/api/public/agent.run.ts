import { createFileRoute } from "@tanstack/react-router";
import { stepAgent } from "@/lib/agent/controller";
import type { AgentSession, AgentStep } from "@/lib/agent/types";

export const Route = createFileRoute("/api/public/agent/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        const goal: string = typeof body.goal === "string" ? body.goal : "untitled";
        const mode: "sandbox" | "strict" = body.mode === "strict" ? "strict" : "sandbox";

        const steps: AgentStep[] = [
          { id: "s1", action: "navigate", route: "/", status: "approved", riskLevel: "low" },
          { id: "s2", action: "navigate", route: "/technologies", status: "approved", riskLevel: "low" },
        ];

        let session: AgentSession = { goal, mode, steps, currentStep: 0 };
        session = stepAgent(session);

        return Response.json({
          goal: session.goal,
          mode: session.mode,
          status: "running",
          currentStep: session.currentStep,
          steps: session.steps,
        });
      },
    },
  },
});
