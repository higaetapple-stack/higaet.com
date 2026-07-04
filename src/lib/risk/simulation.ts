/**
 * Replay Simulation Engine — re-runs historical PR outcomes against
 * alternative thresholds so we can evaluate calibration changes before
 * committing them.
 *
 * Advisory only. Never mutates learning state.
 */

import type { CalibrationThresholds } from "./calibration";
import { DEFAULT_THRESHOLDS } from "./calibration";
import { getAccuracySamples, type AccuracySample } from "./accuracy";
import type { GateDecision } from "./gate";

export interface SimulationCase {
  prNumber: number;
  score: number;
  actualOutcome: "ok" | "incident";
  originalDecision: GateDecision;
}

export interface SimulationRow {
  prNumber: number;
  score: number;
  actualOutcome: "ok" | "incident";
  original: GateDecision;
  simulated: GateDecision;
  delta: "same" | "escalated" | "relaxed";
  explanation: string;
}

export interface SimulationSummary {
  cases: number;
  changed: number;
  escalated: number;
  relaxed: number;
  correctlyEscalated: number; // relaxed→something-blocking on incident samples
  incorrectlyRelaxed: number; // blocking→allow on incident samples
  rows: SimulationRow[];
  thresholds: CalibrationThresholds;
}

function decide(score: number, t: CalibrationThresholds): GateDecision {
  if (score > t.critical) return "BLOCK";
  if (score > t.high) return "WARN";
  return "ALLOW";
}

function rank(d: GateDecision): number {
  return d === "ALLOW" ? 0 : d === "WARN" ? 1 : 2;
}

/** Build synthetic cases from accuracy samples when explicit cases aren't provided. */
export function casesFromAccuracy(): SimulationCase[] {
  return getAccuracySamples().map((s: AccuracySample) => ({
    prNumber: s.prNumber,
    score: s.predictedRisk,
    actualOutcome: s.actualOutcome,
    originalDecision: decide(s.predictedRisk, DEFAULT_THRESHOLDS),
  }));
}

export function simulate(
  thresholds: CalibrationThresholds,
  cases: SimulationCase[] = casesFromAccuracy(),
): SimulationSummary {
  const rows: SimulationRow[] = cases.map((c) => {
    const simulated = decide(c.score, thresholds);
    const dr = rank(simulated) - rank(c.originalDecision);
    const delta: SimulationRow["delta"] =
      dr === 0 ? "same" : dr > 0 ? "escalated" : "relaxed";
    const explanation =
      delta === "same"
        ? `score ${c.score.toFixed(0)} still ${simulated}`
        : `score ${c.score.toFixed(0)} moved ${c.originalDecision}→${simulated} under new thresholds (h=${thresholds.high.toFixed(1)}, c=${thresholds.critical.toFixed(1)})`;
    return {
      prNumber: c.prNumber,
      score: c.score,
      actualOutcome: c.actualOutcome,
      original: c.originalDecision,
      simulated,
      delta,
      explanation,
    };
  });

  const escalated = rows.filter((r) => r.delta === "escalated").length;
  const relaxed = rows.filter((r) => r.delta === "relaxed").length;
  const correctlyEscalated = rows.filter(
    (r) => r.delta === "escalated" && r.actualOutcome === "incident",
  ).length;
  const incorrectlyRelaxed = rows.filter(
    (r) => r.delta === "relaxed" && r.actualOutcome === "incident",
  ).length;

  return {
    cases: rows.length,
    changed: escalated + relaxed,
    escalated,
    relaxed,
    correctlyEscalated,
    incorrectlyRelaxed,
    rows,
    thresholds,
  };
}
