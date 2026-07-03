import type { RoadmapSimulation } from "./types";

/**
 * Portfolio-level health rollup. Sums per-step impact scores; used as the
 * "would we accept this quarter's roadmap?" signal for the CTO view.
 */
export function evaluatePortfolioImpact(simulation: RoadmapSimulation) {
  const totalScore = simulation.timeline.reduce((sum, s) => sum + s.score.score, 0);
  const rounded = Math.round(totalScore * 100) / 100;
  return {
    totalScore: rounded,
    portfolioHealth:
      rounded > 50 ? ("STRONG" as const) : rounded > 10 ? ("STABLE" as const) : ("RISKY" as const),
  };
}
