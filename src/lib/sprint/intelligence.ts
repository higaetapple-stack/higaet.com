import type { SprintIntelligenceContext, SprintItem } from "./types";

/**
 * Fold SRE + RIV + AEOS signals into per-item risk so the sprint builder
 * automatically de-prioritizes items that ship into a shaky system.
 */
export function enrichSprintItems(
  items: SprintItem[],
  ctx: Pick<SprintIntelligenceContext, "sre" | "riv" | "aeos">,
): SprintItem[] {
  const riskBoost =
    ctx.sre.riskScore * 0.3 +
    Math.max(0, ctx.riv.errorDelta) * 2 +
    ctx.aeos.simulation.finalState.incidentRate * 0.5;
  return items.map((item) => ({
    ...item,
    risk: Math.round((item.risk + riskBoost) * 100) / 100,
  }));
}
