import { createFileRoute } from "@tanstack/react-router";
import { generateGoalPlan } from "@/lib/goal/generator";
import { sequenceGoalSteps } from "@/lib/goal/sequencer";
import { generateExecutionPlan } from "@/lib/execution/generator";
import { safetyCheck } from "@/lib/execution/safety";
import { buildWorkflow } from "@/lib/workflow/builder";

export const Route = createFileRoute("/api/public/workflow")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const goal = url.searchParams.get("goal") ?? "";

        const goalPlan = sequenceGoalSteps(
          generateGoalPlan({ intent: goal, memoryBias: 0.5 })
        );
        const execPlan = safetyCheck(generateExecutionPlan(goalPlan));
        const workflow = buildWorkflow(execPlan);

        return Response.json(workflow);
      },
    },
  },
});
