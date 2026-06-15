import type { KernelDecision, KernelInput } from "./types";

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * B.50 Kernel — aggregates read-only signals from B.45/B.47/B.48/B.49
 * and produces a single decision. Never executes, never mutates.
 * Approval gates (B.40/B.41) still apply downstream.
 */
export function runKernel(input: KernelInput = {}): KernelDecision {
  const strategyScore = clamp(input.strategyScore ?? 0.8);
  const simulationScore = clamp(input.simulationScore ?? 0.75);
  const historicalSuccessRate = clamp(input.historicalSuccessRate ?? 0.82);
  const risk = clamp(input.risk ?? 0.3);
  const friction = clamp(input.frictionIndex ?? 0.2);

  const rawConfidence = (strategyScore + simulationScore + historicalSuccessRate) / 3;
  const confidence = clamp(rawConfidence - friction * 0.15);

  if (risk > 0.7) {
    return {
      action: "reject",
      reason: "Risk threshold exceeded",
      signals: { strategy: "blocked", confidence, risk, simulationScore, historicalSuccessRate },
    };
  }
  if (confidence < 0.6) {
    return {
      action: "simulate-more",
      reason: "Insufficient confidence — run additional simulations",
      signals: { strategy: "uncertain", confidence, risk, simulationScore, historicalSuccessRate },
    };
  }
  return {
    action: "execute",
    reason: "System confidence validated; approval gate still required",
    signals: { strategy: "approved", confidence, risk, simulationScore, historicalSuccessRate },
  };
}
