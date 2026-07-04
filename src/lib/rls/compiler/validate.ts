import type { GeneratedPolicy } from "./generate";

export type PolicyValidation = { valid: boolean; issues: string[] };

export function validatePolicy(policy: GeneratedPolicy): PolicyValidation {
  const issues: string[] = [];
  if (!policy.table || policy.table === "unknown") issues.push("Invalid table target");
  if (!policy.role || policy.role === "unknown") issues.push("Invalid role target");
  if (policy.using === "true" && policy.role === "anon") {
    issues.push("Anon full access is unsafe");
  }
  if (policy.using === "false") {
    issues.push("Policy blocks all access (potential dead rule)");
  }
  if (policy.command === "ALL" && policy.using === "true") {
    issues.push("Unrestricted ALL policy — refuse");
  }
  return { valid: issues.length === 0, issues };
}
