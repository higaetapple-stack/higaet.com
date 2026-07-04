import { describe, it, expect, beforeEach } from "vitest";
import {
  _resetCalibration,
  runCalibrationCycle,
  applyProposedThresholds,
  getCurrentThresholds,
  CALIBRATION_LIMITS,
  DEFAULT_THRESHOLDS,
} from "@/lib/risk/calibration";
import {
  _resetAccuracy,
  recordPrediction,
  type ActualOutcome,
} from "@/lib/risk/accuracy";
import { simulate, casesFromAccuracy } from "@/lib/risk/simulation";
import { evaluateDriftAlerts } from "@/lib/risk/alerts";

function seed(n: number, opts: { predictedRisk: number; outcome: ActualOutcome }) {
  for (let i = 0; i < n; i++) {
    recordPrediction({
      prNumber: 1000 + i,
      predictedRisk: opts.predictedRisk,
      predictedLevel: "MEDIUM",
      actualOutcome: opts.outcome,
    });
  }
}

describe("calibration layer", () => {
  beforeEach(() => {
    _resetAccuracy();
    _resetCalibration();
  });

  it("is DISABLED below the minimum sample count", () => {
    seed(5, { predictedRisk: 50, outcome: "ok" });
    const r = runCalibrationCycle();
    expect(r.state).toBe("DISABLED");
    expect(r.reason).toMatch(/insufficient/);
  });

  it("caps per-cycle threshold adjustments to ±10%", () => {
    // Over-predict heavily so bias pushes thresholds up hard
    seed(CALIBRATION_LIMITS.minSamples + 5, { predictedRisk: 90, outcome: "ok" });
    const r = runCalibrationCycle();
    const maxNext = DEFAULT_THRESHOLDS.high * (1 + CALIBRATION_LIMITS.maxAdjustPct) + 0.001;
    expect(r.proposed.high).toBeLessThanOrEqual(maxNext);
  });

  it("applies proposed thresholds only when ACTIVE", () => {
    seed(3, { predictedRisk: 50, outcome: "ok" });
    runCalibrationCycle();
    const applied = applyProposedThresholds();
    expect(applied).toBe(false);
    expect(getCurrentThresholds()).toEqual(DEFAULT_THRESHOLDS);
  });
});

describe("simulation engine", () => {
  beforeEach(() => {
    _resetAccuracy();
    _resetCalibration();
  });

  it("re-runs samples under alternate thresholds and reports deltas", () => {
    recordPrediction({
      prNumber: 1,
      predictedRisk: 50,
      predictedLevel: "HIGH",
      actualOutcome: "incident",
    });
    // Lower critical → the same score becomes BLOCK instead of WARN
    const sim = simulate({ medium: 15, high: 20, critical: 45 }, casesFromAccuracy());
    expect(sim.rows[0].simulated).toBe("BLOCK");
    expect(sim.rows[0].delta).toBe("escalated");
    expect(sim.correctlyEscalated).toBe(1);
  });
});

describe("drift alerts", () => {
  beforeEach(() => _resetAccuracy());

  it("flags under-prediction imbalance", () => {
    seed(15, { predictedRisk: 5, outcome: "incident" });
    const alerts = evaluateDriftAlerts();
    expect(alerts.some((a) => a.id === "under-prediction")).toBe(true);
  });
});
