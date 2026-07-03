import { enrichSprintItems } from "./intelligence";
import { replanSprint } from "./replanner";
import type { SprintIntelligenceContext, SprintPlan } from "./types";

/**
 * Live sprint engine: enrich backlog with system signals, then replan
 * within adjusted capacity. Pure, deterministic, Worker-safe.
 */
export function runLiveSprintEngine(ctx: SprintIntelligenceContext): SprintPlan {
  const enriched = enrichSprintItems(ctx.backlog, {
    sre: ctx.sre,
    riv: ctx.riv,
    aeos: ctx.aeos,
  });
  return replanSprint(
    { capacity: ctx.capacity, healthSignals: ctx.healthSignals },
    enriched,
  );
}
