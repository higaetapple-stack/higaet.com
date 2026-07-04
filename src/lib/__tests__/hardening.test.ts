import { describe, expect, it, beforeEach } from "vitest";
import { buildRelease, extractShaFromRelease, extractEnvFromRelease } from "@/lib/observability/release";
import {
  _resetLearning,
  applyLearningBoost,
  recordOutcome,
  getLearnedWeightBoost,
} from "@/lib/risk/learning";
import { _resetAccuracy, recordPrediction, summarizeAccuracy } from "@/lib/risk/accuracy";
import { onSentryOutcome } from "@/lib/sre/ai/feedback";

describe("release identity contract", () => {
  it("round-trips env + sha", () => {
    const r = buildRelease("production", "abc1234");
    expect(r).toBe("production-abc1234");
    expect(extractShaFromRelease(r)).toBe("abc1234");
    expect(extractEnvFromRelease(r)).toBe("production");
  });
});

describe("learning bounds & poisoning resistance", () => {
  beforeEach(() => _resetLearning());

  it("clamps per-call delta to MAX_WEIGHT_DELTA", () => {
    const next = applyLearningBoost(0, 999);
    expect(next).toBeLessThanOrEqual(0.05);
  });

  it("is idempotent for the same PR+outcome", () => {
    const entry = { prNumber: 42, outcome: "incident" as const, signals: ["Payment flow touched (high risk area)"] };
    recordOutcome(entry);
    recordOutcome(entry);
    recordOutcome(entry);
    // One update should have moved by exactly MAX_WEIGHT_DELTA scaled ×100 = 5
    expect(getLearnedWeightBoost(entry.signals)).toBeCloseTo(5, 3);
  });
});

describe("Sentry → RIV feedback hook", () => {
  beforeEach(() => _resetLearning());

  it("maps confirmed regression to learning signals", () => {
    const analysis = {
      rootCause: {
        hypotheses: [
          { category: "auth" as const, description: "", weight: 0.4, evidence: [] },
          { category: "null-safety" as const, description: "", weight: 0.2, evidence: [] },
        ],
        confidence: 0.6,
        systemic: false,
        topCategory: "auth" as const,
      },
    };
    const res = onSentryOutcome({ prNumber: 7, analysis, outcome: "regression" });
    expect(res.applied).toBe(true);
    expect(getLearnedWeightBoost(["Authentication subsystem modified"])).toBeGreaterThan(0);
  });

  it("ignores false positives", () => {
    const analysis = {
      rootCause: {
        hypotheses: [{ category: "auth" as const, description: "", weight: 0.4, evidence: [] }],
        confidence: 0.4,
        systemic: false,
        topCategory: "auth" as const,
      },
    };
    const res = onSentryOutcome({ prNumber: 8, analysis, outcome: "false_positive" });
    expect(res.applied).toBe(false);
  });
});

describe("prediction accuracy tracker", () => {
  beforeEach(() => _resetAccuracy());

  it("detects over-prediction rate", () => {
    for (let i = 0; i < 5; i++) {
      recordPrediction({
        prNumber: i,
        predictedRisk: 50,
        predictedLevel: "HIGH",
        actualOutcome: "ok",
      });
    }
    const s = summarizeAccuracy();
    expect(s.count).toBe(5);
    expect(s.overPredictionRate).toBe(1);
    expect(s.underPredictionRate).toBe(0);
  });

  it("detects under-prediction on missed incidents", () => {
    for (let i = 0; i < 5; i++) {
      recordPrediction({
        prNumber: i,
        predictedRisk: 5,
        predictedLevel: "LOW",
        actualOutcome: "incident",
      });
    }
    const s = summarizeAccuracy();
    expect(s.underPredictionRate).toBe(1);
    expect(s.meanAbsError).toBeGreaterThan(0);
  });
});
