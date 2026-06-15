export type RuleCategory = "safety" | "efficiency" | "fairness" | "stability";
export type RuleAction = "allow" | "block" | "downgrade";

export type ConstitutionContext = {
  risk: number;
  confidence: number;
  friction: number;
  simulationScore?: number;
  urgency?: number;
};

export type ConstitutionalRule = {
  id: string;
  name: string;
  category: RuleCategory;
  priority: number;
  condition: (context: ConstitutionContext) => boolean;
  action: RuleAction;
};

export type ConstitutionEvaluation = {
  allowed: boolean;
  violations: Array<Omit<ConstitutionalRule, "condition">>;
  severity: number;
};
