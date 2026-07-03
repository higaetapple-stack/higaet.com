import { describe, expect, it } from "vitest";
import { computeReleaseDelta } from "@/lib/releases/delta";
import { calculateImpactScore } from "@/lib/releases/scoring";
import { generateReleaseInsights } from "@/lib/releases/insights";
import type { ReleaseSnapshot } from "@/lib/releases/types";

const before: ReleaseSnapshot = {
  releaseId: "rc-test",
  timestamp: 0,
  errorRate: 2,
  crashCount: 1,
  signupConversion: 40,
  paymentSuccessRate: 92,
  revenue: 10000,
  lighthouseScore: 80,
};

describe("release intelligence", () => {
  it("detects a clear regression", () => {
    const after: ReleaseSnapshot = {
      ...before,
      errorRate: 6,
      crashCount: 5,
      paymentSuccessRate: 85,
      revenue: 9000,
      lighthouseScore: 70,
    };
    const delta = computeReleaseDelta(before, after);
    const score = calculateImpactScore(delta);
    const insights = generateReleaseInsights(delta);
    expect(score.label).toBe("regression");
    expect(score.score).toBeLessThan(0);
    expect(insights.some((s) => /Error rate/.test(s))).toBe(true);
    expect(insights.some((s) => /Payment success/.test(s))).toBe(true);
  });

  it("detects an improvement", () => {
    const after: ReleaseSnapshot = {
      ...before,
      errorRate: 1,
      crashCount: 0,
      signupConversion: 46,
      paymentSuccessRate: 95,
      revenue: 12000,
      lighthouseScore: 90,
    };
    const delta = computeReleaseDelta(before, after);
    const score = calculateImpactScore(delta);
    expect(score.score).toBeGreaterThan(10);
    expect(score.label).toBe("high improvement");
  });

  it("treats a flat release as neutral", () => {
    const delta = computeReleaseDelta(before, { ...before });
    const score = calculateImpactScore(delta);
    expect(score.score).toBe(0);
    expect(score.label).toBe("neutral/improvement");
  });
});
