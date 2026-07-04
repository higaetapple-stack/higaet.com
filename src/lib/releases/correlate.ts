/**
 * Release regression correlation — pure, deterministic scoring.
 *
 * Given an incident cluster's first_seen timestamp and a candidate release,
 * decide how likely the release CAUSED the incident. The heuristic:
 *
 *   - cluster must first_seen AFTER release deployed_at
 *   - closer in time → higher score (decays over 24h window)
 *   - release with many commits / new_groups → higher prior
 *   - cluster with high severity → higher weight
 *
 * Score is bounded 0-100. Score ≥ 50 = suspected regression.
 */

export interface ReleaseCandidate {
  id: string;
  deployed_at: string; // ISO
  commit_count?: number | null;
  new_groups?: number | null;
}

export interface ClusterInput {
  first_seen: string; // ISO
  severity_score: number;
}

const WINDOW_SECONDS = 24 * 60 * 60; // 24h correlation window

export interface CorrelationResult {
  releaseId: string;
  score: number;
  timeDeltaSeconds: number;
  firstSeenAfterRelease: boolean;
  reason: string;
}

/** Score a single (cluster, release) pair. Returns null if release is after cluster. */
export function scoreReleaseCorrelation(
  cluster: ClusterInput,
  release: ReleaseCandidate,
): CorrelationResult | null {
  const clusterTs = Date.parse(cluster.first_seen);
  const releaseTs = Date.parse(release.deployed_at);
  if (!Number.isFinite(clusterTs) || !Number.isFinite(releaseTs)) return null;
  const deltaSec = Math.floor((clusterTs - releaseTs) / 1000);
  if (deltaSec < 0) return null; // cluster existed before the release

  // Proximity: 100 at t=0, 0 at t=WINDOW_SECONDS, linear decay.
  const proximity = Math.max(0, 1 - deltaSec / WINDOW_SECONDS);
  const proximityScore = proximity * 60;

  // Release surface area — deploys touching more code are more suspicious.
  const commitBoost = Math.min(1, Math.log10((release.commit_count ?? 0) + 1) / 1.5) * 15;
  const newGroupsBoost = Math.min(1, Math.log10((release.new_groups ?? 0) + 1) / 1.5) * 10;

  // Cluster severity — high-severity clusters weight the signal higher.
  const severityWeight = Math.max(0, Math.min(15, (cluster.severity_score / 100) * 15));

  const score = Math.round(proximityScore + commitBoost + newGroupsBoost + severityWeight);
  const bounded = Math.max(0, Math.min(100, score));

  const hours = (deltaSec / 3600).toFixed(1);
  return {
    releaseId: release.id,
    score: bounded,
    timeDeltaSeconds: deltaSec,
    firstSeenAfterRelease: true,
    reason: `first seen ${hours}h after deploy · ${release.commit_count ?? 0} commits · +${release.new_groups ?? 0} new groups`,
  };
}

/** Pick the best-scoring release for a cluster within the correlation window. */
export function pickBestCorrelation(
  cluster: ClusterInput,
  releases: ReleaseCandidate[],
): CorrelationResult | null {
  let best: CorrelationResult | null = null;
  for (const r of releases) {
    const s = scoreReleaseCorrelation(cluster, r);
    if (!s) continue;
    if (!best || s.score > best.score) best = s;
  }
  return best && best.score >= 20 ? best : null;
}
