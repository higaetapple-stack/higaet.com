/** Pre-merge risk scorer. Combines static diff analysis + Sentry history. */

import { analyzeDiff, type DiffAnalysis } from "./analyzer";
import { correlateWithSentry, type CorrelationResult } from "./sentry-correlation";
import { getLearnedWeightBoost } from "./learning";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskReport {
  score: number;
  level: RiskLevel;
  signals: string[];
  files: string[];
  complexityScore: number;
  historicalBoost: number;
  learnedBoost: number;
  matches: CorrelationResult["matches"];
}

function toLevel(score: number): RiskLevel {
  if (score > 80) return "CRITICAL";
  if (score > 40) return "HIGH";
  if (score > 15) return "MEDIUM";
  return "LOW";
}

export async function computePreMergeRisk(diff: string): Promise<RiskReport> {
  const analysis: DiffAnalysis = analyzeDiff(diff);
  const correlation = await correlateWithSentry({
    signals: analysis.signals,
    files: analysis.files,
  });
  const learnedBoost = getLearnedWeightBoost(analysis.signals);
  const score = analysis.complexityScore + correlation.riskBoost + learnedBoost;

  return {
    score,
    level: toLevel(score),
    signals: analysis.signals,
    files: analysis.files,
    complexityScore: analysis.complexityScore,
    historicalBoost: correlation.riskBoost,
    learnedBoost,
    matches: correlation.matches,
  };
}
