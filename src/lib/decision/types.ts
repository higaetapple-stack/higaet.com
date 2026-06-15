export type DecisionOption = {
  action: string;
  route?: string;
  confidence: number;
  reasoning: string;
  impactScore: number;
};
