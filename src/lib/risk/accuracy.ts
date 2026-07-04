/**
 * Prediction-accuracy tracker. Compares predicted PR risk against the
 * real-world outcome so the calibration layer can see drift over time.
 *
 * In-isolate memory only (v0). A durable store can subscribe via `onSample`
 * without changing callers.
 */

export type ActualOutcome = "ok" | "incident";

export interface AccuracySample {
  prNumber: number;
  predictedRisk: number;
  predictedLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  actualOutcome: ActualOutcome;
  delta: number; // signed error: actual − predicted (actual mapped to score)
  timestamp: number;
}

export interface AccuracySummary {
  count: number;
  meanAbsError: number;
  overPredictionRate: number; // fraction of samples where we predicted high, outcome was ok
  underPredictionRate: number; // fraction where we predicted low, outcome was incident
  trend: "improving" | "steady" | "drifting";
}

const MAX_SAMPLES = 500;
const samples: AccuracySample[] = [];
const listeners: Array<(s: AccuracySample) => void> = [];

const OUTCOME_TO_SCORE: Record<ActualOutcome, number> = { ok: 0, incident: 60 };

export function recordPrediction(input: {
  prNumber: number;
  predictedRisk: number;
  predictedLevel: AccuracySample["predictedLevel"];
  actualOutcome: ActualOutcome;
}): AccuracySample {
  const actualScore = OUTCOME_TO_SCORE[input.actualOutcome];
  const sample: AccuracySample = {
    prNumber: input.prNumber,
    predictedRisk: input.predictedRisk,
    predictedLevel: input.predictedLevel,
    actualOutcome: input.actualOutcome,
    delta: actualScore - input.predictedRisk,
    timestamp: Date.now(),
  };
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) samples.shift();
  for (const l of listeners) l(sample);
  return sample;
}

export function summarizeAccuracy(): AccuracySummary {
  if (samples.length === 0) {
    return {
      count: 0,
      meanAbsError: 0,
      overPredictionRate: 0,
      underPredictionRate: 0,
      trend: "steady",
    };
  }
  const meanAbsError =
    samples.reduce((s, x) => s + Math.abs(x.delta), 0) / samples.length;
  const over = samples.filter((s) => s.predictedRisk > 40 && s.actualOutcome === "ok").length;
  const under = samples.filter((s) => s.predictedRisk < 15 && s.actualOutcome === "incident").length;

  // Compare recent 20% vs prior 20% to spot drift.
  const window = Math.max(5, Math.floor(samples.length * 0.2));
  const recent = samples.slice(-window);
  const prior = samples.slice(-window * 2, -window);
  const recentErr =
    recent.reduce((s, x) => s + Math.abs(x.delta), 0) / Math.max(1, recent.length);
  const priorErr =
    prior.length > 0
      ? prior.reduce((s, x) => s + Math.abs(x.delta), 0) / prior.length
      : recentErr;
  const trend: AccuracySummary["trend"] =
    recentErr > priorErr * 1.25
      ? "drifting"
      : recentErr < priorErr * 0.85
        ? "improving"
        : "steady";

  return {
    count: samples.length,
    meanAbsError,
    overPredictionRate: over / samples.length,
    underPredictionRate: under / samples.length,
    trend,
  };
}

export function onSample(fn: (s: AccuracySample) => void) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

/** Test-only reset. */
export function _resetAccuracy() {
  samples.length = 0;
  listeners.length = 0;
}
