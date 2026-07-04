export type KnowledgePackage = {
  version: string;
  generatedAt: string;
  expiresAt: string;
  hash: string;
  signature?: string;
  categories: { category: string; frequency: number; confidence: number }[];
  recommendations: { id: string; effectiveness: number }[];
  calibration: { mae: number; drift: number };
};

export type TrustLevel = "internal" | "staging" | "partner" | "experimental";
export const TRUST_SCORES: Record<TrustLevel, number> = {
  internal: 1.0,
  staging: 0.7,
  partner: 0.6,
  experimental: 0.25,
};

export type ValidationResult = { valid: boolean; issues: string[] };

export type MergedRecommendation = {
  id: string;
  localWeight: number;
  externalWeight: number;
  score: number;
  source: "local" | "external" | "merged";
};
