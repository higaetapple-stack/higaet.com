import { describe, expect, it } from "vitest";
import { runSEOA } from "@/lib/seoa/orchestrator";
import { evaluateOrgValue } from "@/lib/seoa/value-function";
import type { SEOAState, WorkItem } from "@/lib/seoa/types";
import { runLiveSprintEngine } from "@/lib/sprint/orchestrator";
import { generateSprintReport } from "@/lib/sprint/executive";
import type { SprintIntelligenceContext, SprintItem } from "@/lib/sprint/types";

const orgState: SEOAState = {
  reliability: 5, revenue: 10, velocity: 5, complexity: 3, capacity: 20,
};

const featurePlan: WorkItem[] = [
  { id: "f1", type: "feature", domain: "payment", effort: 8,
    impact: { reliability: 0, revenue: 8, velocity: 1, complexity: 2 } },
  { id: "f2", type: "feature", domain: "ui", effort: 5,
    impact: { reliability: 0, revenue: 3, velocity: 1, complexity: 1 } },
];

const refactorPlan: WorkItem[] = [
  { id: "r1", type: "refactor", domain: "api", effort: 10,
    impact: { reliability: 4, revenue: 0, velocity: 3, complexity: -4 } },
];

const infeasiblePlan: WorkItem[] = [
  { id: "x1", type: "feature", domain: "auth", effort: 999,
    impact: { reliability: 10, revenue: 10, velocity: 10, complexity: 0 } },
];

describe("seoa", () => {
  it("picks a plan and excludes capacity-infeasible ones", () => {
    const report = runSEOA(orgState, [featurePlan, refactorPlan, infeasiblePlan]);
    expect(report.bestPlan).not.toBeNull();
    expect(report.bestPlan).not.toEqual(infeasiblePlan);
    expect(report.strategy.length).toBeGreaterThan(0);
    expect(["STRONG GROWTH STRATEGY", "BALANCED STRATEGY", "STABILITY-FIRST STRATEGY"])
      .toContain(report.summary.recommendation);
  });

  it("value function penalizes complexity", () => {
    const clean = evaluateOrgValue({ ...orgState, complexity: 0 });
    const messy = evaluateOrgValue({ ...orgState, complexity: 10 });
    expect(clean).toBeGreaterThan(messy);
  });

  it("returns advisory when nothing is feasible", () => {
    const report = runSEOA({ ...orgState, capacity: 0 }, [infeasiblePlan]);
    expect(report.bestPlan).toBeNull();
    expect(report.strategy[0]).toMatch(/No viable plan/i);
  });
});

const backlog: SprintItem[] = [
  { id: "s1", title: "Payment retry", type: "fix", domain: "payment", effort: 3,
    priorityScore: 0, risk: 1,
    predictedImpact: { reliability: 2, revenue: 5, velocity: 0, complexity: 0 } },
  { id: "s2", title: "Auth refactor", type: "refactor", domain: "auth", effort: 5,
    priorityScore: 0, risk: 2,
    predictedImpact: { reliability: 3, revenue: 0, velocity: 1, complexity: -2 } },
  { id: "s3", title: "Big feature", type: "feature", domain: "ui", effort: 8,
    priorityScore: 0, risk: 4,
    predictedImpact: { reliability: 0, revenue: 4, velocity: 1, complexity: 3 } },
];

const baseCtx: SprintIntelligenceContext = {
  backlog, capacity: 10,
  healthSignals: { errorRate: 1, incidentRate: 1, deploymentStability: 0.9 },
  sre: { riskScore: 2 }, riv: { errorDelta: 0.5 },
  aeos: { simulation: { finalState: { incidentRate: 1 } } },
};

describe("live sprint engine", () => {
  it("respects incident-adjusted capacity", () => {
    const plan = runLiveSprintEngine(baseCtx);
    expect(plan.usedCapacity).toBeLessThanOrEqual(baseCtx.capacity);
  });

  it("prefers high-value low-risk items first", () => {
    const plan = runLiveSprintEngine(baseCtx);
    expect(plan.sprint[0].id).toBe("s1");
  });

  it("shrinks scope under heavy incident load", () => {
    const healthy = runLiveSprintEngine(baseCtx);
    const stressed = runLiveSprintEngine({
      ...baseCtx,
      healthSignals: { ...baseCtx.healthSignals, incidentRate: 9 },
    });
    expect(stressed.usedCapacity).toBeLessThanOrEqual(healthy.usedCapacity);
  });

  it("report enumerates selected items", () => {
    const plan = runLiveSprintEngine(baseCtx);
    const report = generateSprintReport(plan);
    expect(report.includedItems.length).toBe(plan.sprint.length);
  });
});
