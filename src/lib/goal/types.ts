export type GoalStep = {
  id: string;
  title: string;
  route?: string;
  action?: string;
  order: number;
  confidence: number;
};

export type GoalPlan = {
  goal: string;
  steps: GoalStep[];
  successProbability: number;
};
