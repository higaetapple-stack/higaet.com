export type SystemSignal = {
  strategy: string;
  confidence: number;
  risk: number;
  simulationScore: number;
  historicalSuccessRate: number;
};

export type KernelAction = "execute" | "simulate-more" | "reject";

export type KernelDecision = {
  action: KernelAction;
  reason: string;
  signals: SystemSignal;
};

export type KernelInput = {
  strategyScore?: number;
  simulationScore?: number;
  historicalSuccessRate?: number;
  risk?: number;
  frictionIndex?: number;
};
