import { computeReleaseDelta } from "./delta";
import { generateReleaseInsights } from "./insights";
import { calculateImpactScore } from "./scoring";
import { fetchReleaseSnapshot } from "./snapshot";
import type { ReleaseReport } from "./types";

/**
 * Build a full release intelligence report for a given release id.
 * Pure orchestration — snapshot source is swappable.
 */
export async function buildReleaseReport(
  releaseId: string,
): Promise<ReleaseReport> {
  const [before, after] = await Promise.all([
    fetchReleaseSnapshot(releaseId, "before"),
    fetchReleaseSnapshot(releaseId, "after"),
  ]);
  const delta = computeReleaseDelta(before, after);
  const score = calculateImpactScore(delta);
  const insights = generateReleaseInsights(delta);
  return { releaseId, before, after, delta, score, insights };
}
