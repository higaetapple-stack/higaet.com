import { generateExecutiveSummary } from "./executive";
import { optimizeRoadmap } from "./optimizer";
import { generateOrgStrategy } from "./recommender";
import type { SEOAReport, SEOAState, WorkItem } from "./types";

/** Run one SEOA cycle: pick best roadmap → strategy → exec summary. Pure. */
export function runSEOA(state: SEOAState, backlog: WorkItem[][]): SEOAReport {
  const optimization = optimizeRoadmap(state, backlog);
  const strategy = generateOrgStrategy(optimization.bestPlan);
  const summary = generateExecutiveSummary(optimization);
  return {
    bestPlan: optimization.bestPlan,
    bestScore: optimization.bestScore,
    strategy,
    summary,
  };
}
