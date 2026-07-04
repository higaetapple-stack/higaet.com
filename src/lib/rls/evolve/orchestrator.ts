import { scorePolicy, type PolicyScore } from "./scoring";
import { detectPolicyDrift, type EvolveDrift } from "./drift";
import { proposePolicyUpdate, type MutationProposal } from "./mutate";

export type EvolutionResult = {
  score: PolicyScore;
  drift: EvolveDrift;
  proposal: MutationProposal;
  decision: "STABLE" | "SUGGEST_RELAXATION" | "SUGGEST_TIGHTENING" | "INSUFFICIENT_DATA";
};

export function runRLSEvolution(table: string, role: string): EvolutionResult {
  const score = scorePolicy(table, role);
  const drift = detectPolicyDrift(score);
  const proposal = proposePolicyUpdate(table, role, drift);
  const decision: EvolutionResult["decision"] =
    drift.type === "UNKNOWN"
      ? "INSUFFICIENT_DATA"
      : !drift.drift
        ? "STABLE"
        : drift.type === "TOO_STRICT"
          ? "SUGGEST_RELAXATION"
          : "SUGGEST_TIGHTENING";
  return { score, drift, proposal, decision };
}
