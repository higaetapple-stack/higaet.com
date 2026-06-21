/**
 * Migrated from /api/public/* HTTP routes → typed server functions.
 *
 * All require an authenticated user via requireSupabaseAuth. Bearer tokens
 * are attached automatically by attachSupabaseAuth in src/start.ts.
 *
 * Callers: import and use with useServerFn() in components/hooks.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withTrace, withTimeout } from "@/lib/observability/sentry-server";

import { stepAgent } from "@/lib/agent/controller";
import type { AgentSession, AgentStep } from "@/lib/agent/types";

import { createAgentPlan } from "@/lib/multi-agent/supervisor";
import { runMultiAgentSystem } from "@/lib/multi-agent/orchestrator";
import { aggregateResults } from "@/lib/multi-agent/aggregator";

import { runKernel } from "@/lib/kernel/engine";

import { generateGoalPlan } from "@/lib/goal/generator";
import { sequenceGoalSteps } from "@/lib/goal/sequencer";
import { generateExecutionPlan } from "@/lib/execution/generator";
import { safetyCheck } from "@/lib/execution/safety";
import { requiresUserApproval } from "@/lib/execution/gate";
import { buildWorkflow } from "@/lib/workflow/builder";

import { runSimulation } from "@/lib/simulation/engine";
import { simulateAgents } from "@/lib/simulation/agents";
import { aggregateSimulation } from "@/lib/simulation/aggregator";

/* ------------------------------ agent.run ------------------------------ */

export const runAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { goal?: string; mode?: "sandbox" | "strict" }) => ({
    goal: typeof input?.goal === "string" ? input.goal : "untitled",
    mode: (input?.mode === "strict" ? "strict" : "sandbox") as "sandbox" | "strict",
  }))
  .handler(async ({ data }) =>
    withTrace("agent.run", "ai", async ({ traceId }) => {
      const steps: AgentStep[] = [
        { id: "s1", action: "navigate", route: "/", status: "approved", riskLevel: "low" },
        { id: "s2", action: "navigate", route: "/technologies", status: "approved", riskLevel: "low" },
      ];
      let session: AgentSession = { goal: data.goal, mode: data.mode, steps, currentStep: 0 };
      session = await withTimeout(15_000, async () => stepAgent(session), "agent.step");
      return {
        goal: session.goal,
        mode: session.mode,
        status: "running" as const,
        currentStep: session.currentStep,
        steps: session.steps,
        traceId,
      };
    }),
  );

/* ----------------------------- multi-agent ----------------------------- */

export const runMultiAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { goal?: string }) => ({
    goal: typeof input?.goal === "string" ? input.goal : "untitled",
  }))
  .handler(async ({ data }) =>
    withTrace("multi-agent", "ai", async ({ traceId }) => {
      const { ctx, result } = await withTimeout(
        20_000,
        async () => {
          const ctx = runMultiAgentSystem(createAgentPlan(data.goal));
          return { ctx, result: aggregateResults(ctx) };
        },
        "multi-agent.run",
      );
      return { ...result, tasks: ctx.tasks, traceId };
    }),
  );

/* --------------------------- kernel.decision --------------------------- */

export const runKernelDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      strategy?: number;
      simulation?: number;
      history?: number;
      risk?: number;
      friction?: number;
    }) => ({
      strategyScore: Number.isFinite(input?.strategy) ? input!.strategy : undefined,
      simulationScore: Number.isFinite(input?.simulation) ? input!.simulation : undefined,
      historicalSuccessRate: Number.isFinite(input?.history) ? input!.history : undefined,
      risk: Number.isFinite(input?.risk) ? input!.risk : undefined,
      frictionIndex: Number.isFinite(input?.friction) ? input!.friction : undefined,
    }),
  )
  .handler(async ({ data }) => {
    const decision = runKernel(data);
    return {
      action: decision.action,
      reason: decision.reason,
      confidence: decision.signals.confidence,
      risk: decision.signals.risk,
      signals: decision.signals,
    };
  });

/* ---------------------------- execution-plan --------------------------- */

export const getExecutionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { goal?: string }) => ({ goal: input?.goal ?? "" }))
  .handler(async ({ data }) => {
    const goalPlan = sequenceGoalSteps(generateGoalPlan({ intent: data.goal, memoryBias: 0.5 }));
    return requiresUserApproval(safetyCheck(generateExecutionPlan(goalPlan)));
  });

/* ------------------------------- workflow ------------------------------ */

export const getWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { goal?: string }) => ({ goal: input?.goal ?? "" }))
  .handler(async ({ data }) => {
    const goalPlan = sequenceGoalSteps(generateGoalPlan({ intent: data.goal, memoryBias: 0.5 }));
    const execPlan = safetyCheck(generateExecutionPlan(goalPlan));
    return buildWorkflow(execPlan);
  });

/* ------------------------------- simulate ------------------------------ */

export const runSimulate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { goal?: string; complexity?: number; risk?: number }) => {
    const goal = (input?.goal ?? "").slice(0, 500);
    if (!goal) throw new Error("missing goal");
    return {
      goal,
      complexity: Number.isFinite(input?.complexity) ? input!.complexity! : 0.5,
      riskLevel: Number.isFinite(input?.risk) ? input!.risk! : 0.2,
    };
  })
  .handler(async ({ data }) => {
    const result = runSimulation(data);
    const agents = simulateAgents(data.goal);
    const summary = aggregateSimulation(result, agents);
    return { result, agents, summary };
  });
