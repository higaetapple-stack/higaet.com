/**
 * Self-learning PR risk model (v0). In-isolate, non-persistent memory of
 * PR outcomes → signal weights. Deliberately simple; a durable RIV backing
 * store can subscribe to `recordOutcome` later without changing callers.
 */

export type PROutcome = "clean" | "incident" | "regression";

interface SignalStat {
  weight: number; // additive risk boost
  samples: number;
}

const stats = new Map<string, SignalStat>();
const listeners: Array<(entry: OutcomeEntry) => void> = [];

export interface OutcomeEntry {
  prNumber: number;
  outcome: PROutcome;
  signals: string[];
  timestamp: number;
}

const DELTA: Record<PROutcome, number> = {
  clean: -1,
  incident: 5,
  regression: 3,
};

export function recordOutcome(entry: Omit<OutcomeEntry, "timestamp">) {
  const full: OutcomeEntry = { ...entry, timestamp: Date.now() };
  const delta = DELTA[entry.outcome];
  for (const signal of entry.signals) {
    const cur = stats.get(signal) ?? { weight: 0, samples: 0 };
    // Bounded update — prevents any single signal from dominating.
    cur.weight = Math.max(-10, Math.min(40, cur.weight + delta));
    cur.samples += 1;
    stats.set(signal, cur);
  }
  for (const l of listeners) l(full);
}

export function getLearnedWeightBoost(signals: string[]): number {
  let boost = 0;
  for (const s of signals) boost += stats.get(s)?.weight ?? 0;
  return boost;
}

export function getLearnedStats(): Record<string, SignalStat> {
  return Object.fromEntries(stats);
}

export function onOutcome(fn: (entry: OutcomeEntry) => void) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

/** Test-only reset. */
export function _resetLearning() {
  stats.clear();
  listeners.length = 0;
}
