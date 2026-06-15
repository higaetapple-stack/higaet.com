import { CONSTITUTION } from "./rules";
import type { ConstitutionContext, ConstitutionEvaluation } from "./types";

export function evaluateConstitution(
  context: ConstitutionContext,
): ConstitutionEvaluation {
  const violations = CONSTITUTION.filter((rule) => rule.condition(context)).map(
    ({ condition: _c, ...rest }) => rest,
  );

  const blocked = violations.some((v) => v.action === "block");

  return {
    allowed: !blocked,
    violations,
    severity: violations.length,
  };
}
