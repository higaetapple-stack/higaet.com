/**
 * Self-learning PR risk model. Bounded, poisoning-resistant.
 *
 * Anti-poisoning invariants:
 *   - Per-call delta is clamped to MAX_WEIGHT_DELTA (±0.05 by default).
 *   - Total weight is clamped to [MIN_WEIGHT, MAX_WEIGHT].
 *   - Same PR + same outcome only counts once (idempotency guard).
 */

export type PROutcome = "clean" | "incident" | "regression";

interface SignalStat {
  weight: number;
  samples: number;
  lastUpdated: number;
}

export interface OutcomeEntry {
  prNumber: number;
  outcome: PROutcome;
  signals: string[];
  timestamp: number;
}

const MAX_WEIGHT_DELTA = 0.05; // per outcome, per signal
const MAX_WEIGHT = 40;
const MIN_WEIGHT = -10;

// Raw impact per outcome; the applied delta is clamped to MAX_WEIGHT_DELTA.
const RAW_DELTA: Record<PROutcome, number> = {
  clean: -0.05,
  incident: 0.05,
  regression: 0.04,
};

const stats = new Map<string, SignalStat>();
const listeners: Array<(entry: OutcomeEntry) => void> = [];
const seen = new Set<string>(); // `${prNumber}:${outcome}`

export function applyLearningBoost(current: number, delta: number): number {
  const clamped = Math.max(-MAX_WEIGHT_DELTA, Math.min(MAX_WEIGHT_DELTA, delta));
  return Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, current + clamped));
}

export function recordOutcome(entry: Omit<OutcomeEntry, "timestamp">) {
  const key = `${entry.prNumber}:${entry.outcome}`;
  if (seen.has(key)) return; // idempotent — replayed webhooks can't skew the model
  seen.add(key);

  const full: OutcomeEntry = { ...entry, timestamp: Date.now() };
  const raw = RAW_DELTA[entry.outcome];
  for (const signal of entry.signals) {
    const cur = stats.get(signal) ?? { weight: 0, samples: 0, lastUpdated: 0 };
    cur.weight = applyLearningBoost(cur.weight, raw);
    cur.samples += 1;
    cur.lastUpdated = full.timestamp;
    stats.set(signal, cur);
  }
  for (const l of listeners) l(full);
}

export function getLearnedWeightBoost(signals: string[]): number {
  // Return the *scaled* boost — internal weight is a small, bounded number;
  // callers of the scorer want a comparable point value.
  let boost = 0;
  for (const s of signals) boost += (stats.get(s)?.weight ?? 0) * 100;
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
  seen.clear();
}
