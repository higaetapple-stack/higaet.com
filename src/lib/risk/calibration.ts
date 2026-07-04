/**
 * AI SRE Calibration Layer — bounded auto-tuning of risk thresholds.
 *
 * Reads the accuracy tracker to nudge HIGH/CRITICAL thresholds up or down.
 * Advisory only: returns proposed thresholds; the gate keeps using them
 * only after a caller opts in via `applyProposedThresholds`.
 *
 * Safety rules (see CALIBRATION_LIMITS):
 *   - Drift > 0.25 → FROZEN
 *   - MAE worsening for 3 cycles → DISABLED
 *   - Max adjustment per cycle: ±10%
 *   - Minimum dataset: 20 samples before ACTIVE
 */

import { getAccuracySamples, summarizeAccuracy, rollingMAE } from "./accuracy";

export type CalibrationState = "ACTIVE" | "FROZEN" | "DISABLED";

export interface CalibrationThresholds {
  medium: number; // score > medium → MEDIUM
  high: number; // score > high → HIGH
  critical: number; // score > critical → CRITICAL
}

export interface CalibrationReport {
  state: CalibrationState;
  reason: string;
  current: CalibrationThresholds;
  proposed: CalibrationThresholds;
  cycle: number;
  samples: number;
  mae: number;
  drift: number;
  worseningStreak: number;
  cappedAdjustment: boolean;
}

export const DEFAULT_THRESHOLDS: CalibrationThresholds = {
  medium: 15,
  high: 40,
  critical: 80,
};

export const CALIBRATION_LIMITS = {
  minSamples: 20,
  freezeDriftAbove: 0.25,
  maxWorseningStreak: 3,
  maxAdjustPct: 0.1,
} as const;

// Module-scope calibration memory (per isolate).
let current: CalibrationThresholds = { ...DEFAULT_THRESHOLDS };
let cycle = 0;
let worseningStreak = 0;
let priorMae = 0;
let disabled = false;
let lastReport: CalibrationReport | null = null;

function driftScore(): number {
  const s = getAccuracySamples();
  if (s.length < 10) return 0;
  const window = Math.max(5, Math.floor(s.length * 0.2));
  const recent = s.slice(-window);
  const prior = s.slice(-window * 2, -window);
  if (prior.length === 0) return 0;
  const recentMae =
    recent.reduce((a, x) => a + Math.abs(x.delta), 0) / recent.length;
  const priorMae =
    prior.reduce((a, x) => a + Math.abs(x.delta), 0) / prior.length;
  const denom = Math.max(1, priorMae);
  return Math.abs(recentMae - priorMae) / denom;
}

function clampAdjust(next: number, base: number): { value: number; capped: boolean } {
  const maxDelta = base * CALIBRATION_LIMITS.maxAdjustPct;
  const delta = Math.max(-maxDelta, Math.min(maxDelta, next - base));
  return { value: base + delta, capped: Math.abs(next - base) > maxDelta };
}

/**
 * Compute a fresh calibration report. Pure w.r.t. the passed samples aside
 * from advancing the internal streak counter — safe to call periodically.
 */
export function runCalibrationCycle(): CalibrationReport {
  cycle += 1;
  const summary = summarizeAccuracy();
  const drift = driftScore();
  const mae = rollingMAE(20);

  // Worsening MAE detection
  if (priorMae > 0 && mae > priorMae * 1.05) worseningStreak += 1;
  else worseningStreak = 0;
  priorMae = mae;

  let state: CalibrationState = "ACTIVE";
  let reason = "calibration active";
  let proposed = { ...current };
  let capped = false;

  if (disabled || worseningStreak >= CALIBRATION_LIMITS.maxWorseningStreak) {
    disabled = true;
    state = "DISABLED";
    reason = `MAE worsened for ${worseningStreak} cycles — tuning disabled`;
  } else if (summary.count < CALIBRATION_LIMITS.minSamples) {
    state = "DISABLED";
    reason = `insufficient data (${summary.count}/${CALIBRATION_LIMITS.minSamples})`;
  } else if (drift > CALIBRATION_LIMITS.freezeDriftAbove) {
    state = "FROZEN";
    reason = `drift ${drift.toFixed(2)} above freeze threshold ${CALIBRATION_LIMITS.freezeDriftAbove}`;
  } else {
    // Nudge thresholds based on over/under prediction rates.
    // Over-predicting → raise HIGH/CRITICAL (we're crying wolf).
    // Under-predicting → lower them (we're missing real incidents).
    const bias = summary.overPredictionRate - summary.underPredictionRate;
    const highNext = current.high * (1 + bias * 0.5);
    const criticalNext = current.critical * (1 + bias * 0.5);
    const h = clampAdjust(highNext, current.high);
    const c = clampAdjust(criticalNext, current.critical);
    capped = h.capped || c.capped;
    proposed = {
      medium: current.medium,
      high: Math.max(current.medium + 1, h.value),
      critical: Math.max(h.value + 1, c.value),
    };
    reason = `bias ${bias.toFixed(2)} → high ${current.high.toFixed(1)}→${proposed.high.toFixed(1)}`;
  }

  const report: CalibrationReport = {
    state,
    reason,
    current: { ...current },
    proposed,
    cycle,
    samples: summary.count,
    mae,
    drift,
    worseningStreak,
    cappedAdjustment: capped,
  };
  lastReport = report;
  return report;
}

/** Commit the last proposed thresholds if state is ACTIVE. Returns true on apply. */
export function applyProposedThresholds(): boolean {
  if (!lastReport || lastReport.state !== "ACTIVE") return false;
  current = { ...lastReport.proposed };
  return true;
}

export function getCurrentThresholds(): CalibrationThresholds {
  return { ...current };
}

export function getLastCalibrationReport(): CalibrationReport | null {
  return lastReport ? { ...lastReport } : null;
}

/** Test-only reset. */
export function _resetCalibration() {
  current = { ...DEFAULT_THRESHOLDS };
  cycle = 0;
  worseningStreak = 0;
  priorMae = 0;
  disabled = false;
  lastReport = null;
}
