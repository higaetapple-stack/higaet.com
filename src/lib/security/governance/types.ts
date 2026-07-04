export type GovernanceDecision = "ALLOW" | "WARN" | "BLOCK" | "REVIEW_REQUIRED";

export type GovernanceSource =
  | "compiler"
  | "predictor"
  | "evolver"
  | "rollback"
  | "runtime";

export type GovernanceContext = {
  source: GovernanceSource;
  riskScore: number;
  explanation?: string[];
  confidence?: number;
  tenantId?: string;
  table?: string;
};

export type GovernanceResult = {
  decision: GovernanceDecision;
  riskScore: number;
  confidence: number;
  explanation: string[];
};
