import { evaluatePortfolioImpact } from "./cto-view";
import { simulateRoadmap } from "./future-sim";
import { recommendNextActions } from "./recommender";
import type { AEOSReport, OrgState, SimulatedChange } from "./types";

/**
 * Run one full AEOS cycle: simulate roadmap → score portfolio → recommend.
 * Pure function. No I/O, no network, no side effects — safe on Worker.
 */
export function runAEOS(initialState: OrgState, roadmap: SimulatedChange[]): AEOSReport {
  const simulation = simulateRoadmap(initialState, roadmap);
  const portfolio = evaluatePortfolioImpact(simulation);
  const recommendations = recommendNextActions(simulation);
  return { simulation, portfolio, recommendations };
}
