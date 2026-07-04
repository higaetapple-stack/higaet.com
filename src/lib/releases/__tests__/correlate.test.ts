import { describe, it, expect } from "vitest";
import { scoreReleaseCorrelation, pickBestCorrelation } from "../correlate";

const REL = (id: string, at: string, extra: Partial<{ commit_count: number; new_groups: number }> = {}) => ({
  id,
  deployed_at: at,
  commit_count: extra.commit_count ?? 0,
  new_groups: extra.new_groups ?? 0,
});

describe("scoreReleaseCorrelation", () => {
  it("returns null if release deployed after cluster first_seen", () => {
    const s = scoreReleaseCorrelation(
      { first_seen: "2026-01-01T10:00:00Z", severity_score: 50 },
      REL("r1", "2026-01-01T11:00:00Z"),
    );
    expect(s).toBeNull();
  });

  it("gives highest score when cluster first_seen is right after deploy", () => {
    const s = scoreReleaseCorrelation(
      { first_seen: "2026-01-01T10:05:00Z", severity_score: 80 },
      REL("r1", "2026-01-01T10:00:00Z", { commit_count: 20, new_groups: 5 }),
    );
    expect(s).not.toBeNull();
    expect(s!.score).toBeGreaterThan(70);
    expect(s!.firstSeenAfterRelease).toBe(true);
    expect(s!.timeDeltaSeconds).toBe(300);
  });

  it("decays toward zero at the 24h boundary", () => {
    const near = scoreReleaseCorrelation(
      { first_seen: "2026-01-01T10:05:00Z", severity_score: 10 },
      REL("r1", "2026-01-01T10:00:00Z"),
    )!;
    const far = scoreReleaseCorrelation(
      { first_seen: "2026-01-02T09:55:00Z", severity_score: 10 },
      REL("r1", "2026-01-01T10:00:00Z"),
    )!;
    expect(near.score).toBeGreaterThan(far.score);
  });
});

describe("pickBestCorrelation", () => {
  it("returns the highest-scoring recent release", () => {
    const cluster = { first_seen: "2026-01-01T10:30:00Z", severity_score: 60 };
    const best = pickBestCorrelation(cluster, [
      REL("old", "2025-12-30T00:00:00Z", { commit_count: 100 }),
      REL("recent", "2026-01-01T10:00:00Z", { commit_count: 5, new_groups: 2 }),
      REL("future", "2026-01-02T00:00:00Z"),
    ]);
    expect(best?.releaseId).toBe("recent");
  });

  it("returns null when no release scores ≥20", () => {
    const cluster = { first_seen: "2026-01-05T00:00:00Z", severity_score: 5 };
    const best = pickBestCorrelation(cluster, [
      REL("old", "2026-01-01T00:00:00Z"),
    ]);
    expect(best).toBeNull();
  });
});
