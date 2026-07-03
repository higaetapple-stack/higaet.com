// Release Intelligence (RIV) — types
// Contract shared by snapshot collection, delta computation, scoring, and UI.

export type ReleaseSnapshot = {
  releaseId: string;
  timestamp: number;

  // Reliability
  errorRate: number; // percent (0-100)
  crashCount: number;

  // Product
  signupConversion: number; // percent
  paymentSuccessRate: number; // percent

  // Business
  revenue: number; // in reporting currency, integer units

  // Frontend
  lighthouseScore: number; // 0-100
};

export type ReleaseDelta = {
  errorDelta: number;
  crashDelta: number;
  signupDelta: number;
  paymentDelta: number;
  revenueDelta: number;
  lighthouseDelta: number;
};

export type ImpactLabel =
  | "high improvement"
  | "neutral/improvement"
  | "regression";

export type ImpactScore = {
  score: number;
  label: ImpactLabel;
};

export type ReleaseReport = {
  releaseId: string;
  before: ReleaseSnapshot;
  after: ReleaseSnapshot;
  delta: ReleaseDelta;
  score: ImpactScore;
  insights: string[];
};
