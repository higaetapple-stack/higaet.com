import type { GateDecision } from "../types";
import { parseIntent, type AccessIntent } from "./intent";
import { generateRLS, type GeneratedPolicy } from "./generate";
import { validatePolicy, type PolicyValidation } from "./validate";
import { predictRLSFailure, type PredictionResult } from "../predict/orchestrator";

export type CompileResult = {
  intent: AccessIntent;
  policy: GeneratedPolicy;
  validation: PolicyValidation;
  prediction: PredictionResult;
  decision: GateDecision;
};

export function compileRLS(intentText: string): CompileResult {
  const intent = parseIntent(intentText);
  const policy = generateRLS(intent);
  const validation = validatePolicy(policy);
  const prediction = predictRLSFailure(JSON.stringify(policy));
  const decision: GateDecision = !validation.valid
    ? "BLOCK"
    : prediction.decision;
  return { intent, policy, validation, prediction, decision };
}
