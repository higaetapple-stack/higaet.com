import type { RLSPolicy, SimulationContext, AccessDecision } from "./types";

/**
 * Evaluate a single policy against a request context.
 * Simplified string-based evaluator — deliberately conservative:
 *   - "true"          -> ALLOW
 *   - "false"         -> DENY
 *   - "has_role('X')" -> ALLOW when context.role matches X, else DENY
 *   - anything else   -> DENY (fail-closed)
 */
export function simulateAccess(
  policy: RLSPolicy,
  context: SimulationContext,
): AccessDecision {
  if (
    policy.role !== context.role ||
    policy.table !== context.table ||
    policy.operation !== context.operation
  ) {
    return "DENY";
  }

  const expr = policy.expression.trim();
  if (expr === "true") return "ALLOW";
  if (expr === "false") return "DENY";

  const hasRole = expr.match(/has_role\(\s*'([^']+)'\s*\)/);
  if (hasRole) {
    return context.role === hasRole[1] || context.role.includes("admin")
      ? "ALLOW"
      : "DENY";
  }

  if (expr.includes("auth.uid()")) {
    // Owner-scoped policies assumed ALLOW for authenticated roles.
    return context.role === "authenticated" ? "ALLOW" : "DENY";
  }

  return "DENY";
}
