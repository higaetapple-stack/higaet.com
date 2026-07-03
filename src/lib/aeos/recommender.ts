import type { RoadmapSimulation } from "./types";

/**
 * Portfolio-level recommendations from a simulated roadmap final state.
 * Conservative thresholds — advisory output only, never a directive.
 */
export function recommendNextActions(simulation: RoadmapSimulation): string[] {
  const recommendations: string[] = [];
  const final = simulation.finalState;

  if (final.errorRate > 3) {
    recommendations.push("Prioritize reliability fixes (auth + payments).");
  }
  if (final.revenue < 0) {
    recommendations.push("Pause feature expansion — focus on conversion recovery.");
  }
  if (final.latency > 200) {
    recommendations.push("Schedule a performance optimization sprint.");
  }
  if (final.developerLoad > 8) {
    recommendations.push("Refactor to reduce system complexity and cognitive load.");
  }
  if (final.incidentRate > 3) {
    recommendations.push("Freeze risky merges — investigate incident cluster.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Roadmap looks healthy — continue current cadence.");
  }
  return recommendations;
}
