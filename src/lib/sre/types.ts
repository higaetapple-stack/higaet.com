import type { ImpactScore, ReleaseDelta } from "../releases/types";

export type SREDecision = "ALLOW" | "WARN" | "ROLLBACK_RECOMMENDED";

export type SREAnalysis = {
  releaseId: string;
  delta: ReleaseDelta;
  score: ImpactScore;
  insights: string[];
  decision: SREDecision;
  reasons: string[];
};

export type PredictiveContext = {
  paymentFailures: number;
  errorRate: number;
  signupDrop: number;
  authErrors: number;
  lighthouseScore: number;
};

export type PredictiveRisk = "LOW" | "MEDIUM" | "HIGH";

export type PredictiveResult = {
  riskLevel: PredictiveRisk;
  warnings: string[];
  allowDeploy: boolean;
};

export type PatchPlan = {
  file: string;
  change: string;
  needsManualReview: boolean;
};

export type FixPlan = {
  releaseId: string;
  fixes: string[];
  patches: PatchPlan[];
  hasSafeFix: boolean;
};
