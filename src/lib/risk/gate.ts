/** CI gate decision engine. Advisory: warn/block, never auto-merge. */

import { computePreMergeRisk, type RiskReport } from "./scorer";
import { predictFailureMode } from "@/lib/sre/ai/predictor";

export type GateDecision = "ALLOW" | "WARN" | "BLOCK";

export interface GateResult {
  decision: GateDecision;
  risk: RiskReport;
  predictions: string[];
}

export async function evaluatePR(diff: string): Promise<GateResult> {
  const risk = await computePreMergeRisk(diff);
  const predictions = predictFailureMode(risk);
  const decision: GateDecision =
    risk.level === "CRITICAL" ? "BLOCK" : risk.level === "HIGH" ? "WARN" : "ALLOW";
  return { decision, risk, predictions };
}
