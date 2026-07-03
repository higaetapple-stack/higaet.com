import type { OrgState, SimulatedChange } from "./types";

/**
 * Simulate the effect of a single change on the org state.
 * Deterministic, pure. All heuristics are intentionally conservative so the
 * simulator behaves as a "what-if" advisor, not a predictor.
 */
export function simulateChange(state: OrgState, change: SimulatedChange): OrgState {
  const next: OrgState = { ...state };

  if (change.affects === "auth") {
    next.errorRate += 0.5;
    next.incidentRate += 1;
  }
  if (change.affects === "payment") {
    next.revenue -= 2;
    next.errorRate += 0.8;
  }
  if (change.affects === "performance") {
    next.latency += 50;
  }
  if (change.affects === "infra") {
    next.latency -= 20;
    next.developerLoad -= 0.1;
  }

  if (change.type === "refactor") {
    next.developerLoad -= 0.2;
    next.incidentRate -= 0.3;
  }
  if (change.type === "feature") {
    next.developerLoad += 0.3;
  }
  if (change.type === "fix") {
    next.errorRate -= 0.4;
    next.incidentRate -= 0.5;
  }

  return round(next);
}

function round(s: OrgState): OrgState {
  const r = (n: number) => Math.round(n * 100) / 100;
  return {
    errorRate: r(s.errorRate),
    revenue: r(s.revenue),
    latency: r(s.latency),
    deploymentFrequency: r(s.deploymentFrequency),
    incidentRate: r(s.incidentRate),
    developerLoad: r(s.developerLoad),
  };
}
