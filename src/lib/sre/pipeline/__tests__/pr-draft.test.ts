import { describe, expect, it } from "vitest";
import type { AISREAnalysis } from "@/lib/sre/ai/orchestrator";
import { buildPRDraft, computeAnalysisHash, computeRiskScore } from "../pr-draft";

const analysis: AISREAnalysis = {
  issueId: "12345",
  shortId: "PROJ-42",
  rootCause: {
    hypotheses: [
      { category: "auth", description: "Token expiry", weight: 0.6, evidence: ["/api/session"] },
    ],
    confidence: 0.82,
    systemic: false,
    topCategory: "auth",
  },
  fixPlan: [
    { action: "Refresh JWT before request", risk: "low", targetHint: "src/lib/auth.ts", testHint: "auth.spec.ts" },
  ],
  prSuggestion: {
    title: "fix(sre): Token expiry",
    body: "root cause + fix",
    labels: ["sre", "auth"],
    branchHint: "sre/token",
    requiresHumanReview: true,
  },
  autoPRRecommended: true,
};

describe("buildPRDraft", () => {
  it("produces a deterministic branch slug from shortId + category", () => {
    const d = buildPRDraft(analysis, { id: "12345", shortId: "PROJ-42", title: "Token expiry" });
    expect(d.branch).toBe("sre/proj-42-auth");
    expect(d.labels).toContain("auth");
    expect(d.requiresHumanReview).toBe(true);
    expect(d.fixes[0].risk).toBe("low");
  });

  it("hashes the same analysis to the same digest", () => {
    expect(computeAnalysisHash(analysis)).toBe(computeAnalysisHash(analysis));
  });

  it("changes hash when the plan changes", () => {
    const other = { ...analysis, fixPlan: [{ ...analysis.fixPlan[0], action: "different" }] };
    expect(computeAnalysisHash(other)).not.toBe(computeAnalysisHash(analysis));
  });

  it("computes a bounded risk score", () => {
    const s = computeRiskScore(analysis);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});
