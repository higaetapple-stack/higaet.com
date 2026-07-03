import { describe, expect, it } from "vitest";
import { runAEOS } from "@/lib/aeos/orchestrator";
import { simulateChange } from "@/lib/aeos/simulator";
import { scoreOrgImpact } from "@/lib/aeos/scoring";
import type { OrgState, SimulatedChange } from "@/lib/aeos/types";

const baseline: OrgState = {
  errorRate: 2,
  revenue: 100,
  latency: 150,
  deploymentFrequency: 5,
  incidentRate: 1,
  developerLoad: 5,
};

describe("aeos simulator", () => {
  it("payment feature reduces revenue and raises errors", () => {
    const after = simulateChange(baseline, {
      id: "c1", type: "feature", affects: "payment",
    });
    expect(after.revenue).toBeLessThan(baseline.revenue);
    expect(after.errorRate).toBeGreaterThan(baseline.errorRate);
  });

  it("refactor reduces developer load and incidents", () => {
    const after = simulateChange(baseline, {
      id: "c2", type: "refactor", affects: "infra",
    });
    expect(after.developerLoad).toBeLessThan(baseline.developerLoad);
    expect(after.incidentRate).toBeLessThan(baseline.incidentRate);
  });
});

describe("aeos scoring", () => {
  it("classifies negative impact when reliability drops", () => {
    const bad = { ...baseline, errorRate: 6, revenue: 90, incidentRate: 3 };
    expect(scoreOrgImpact(baseline, bad).classification).toBe("NEGATIVE_IMPACT");
  });
  it("classifies positive when incidents fall", () => {
    const good = { ...baseline, errorRate: 1, incidentRate: 0, revenue: 105 };
    expect(scoreOrgImpact(baseline, good).classification).not.toBe("NEGATIVE_IMPACT");
  });
});

describe("aeos orchestrator", () => {
  it("produces recommendations for a risky roadmap", () => {
    const roadmap: SimulatedChange[] = [
      { id: "1", type: "feature", affects: "payment" },
      { id: "2", type: "feature", affects: "auth" },
      { id: "3", type: "feature", affects: "auth" },
    ];
    const report = runAEOS(baseline, roadmap);
    expect(report.simulation.timeline).toHaveLength(3);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(["STRONG", "STABLE", "RISKY"]).toContain(report.portfolio.portfolioHealth);
  });

  it("empty roadmap returns healthy advisory", () => {
    const report = runAEOS(baseline, []);
    expect(report.simulation.timeline).toEqual([]);
    expect(report.recommendations[0]).toMatch(/healthy/i);
  });
});
