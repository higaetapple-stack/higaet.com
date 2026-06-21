import { createFileRoute } from "@tanstack/react-router";
import { generateGoalPlan } from "@/lib/goal/generator";
import { sequenceGoalSteps } from "@/lib/goal/sequencer";
import { generateExecutionPlan } from "@/lib/execution/generator";
import { safetyCheck } from "@/lib/execution/safety";
import { requiresUserApproval } from "@/lib/execution/gate";
import { requireAuthHttp } from "@/lib/server/require-auth-http";

export const Route = createFileRoute("/api/public/execution-plan")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAuthHttp(request);
        if (!auth.ok) return auth.response;
        const url = new URL(request.url);
        const goal = url.searchParams.get("goal") ?? "";

        const goalPlan = sequenceGoalSteps(
          generateGoalPlan({ intent: goal, memoryBias: 0.5 })
        );

        const plan = requiresUserApproval(
          safetyCheck(generateExecutionPlan(goalPlan))
        );

        return Response.json(plan);
      },
    },
  },
});
