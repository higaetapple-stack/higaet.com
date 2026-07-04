import type { EvolveDrift } from "./drift";

export type MutationProposal = {
  action: "RELAX_POLICY" | "TIGHTEN_POLICY";
  suggestion: string;
} | null;

export function proposePolicyUpdate(
  table: string,
  role: string,
  drift: EvolveDrift,
): MutationProposal {
  if (drift.type === "TOO_STRICT") {
    return {
      action: "RELAX_POLICY",
      suggestion: `Add additional ALLOW condition for ${role} on ${table}`,
    };
  }
  if (drift.type === "TOO_OPEN") {
    return {
      action: "TIGHTEN_POLICY",
      suggestion: `Restrict ${role} access scope on ${table}`,
    };
  }
  return null;
}
