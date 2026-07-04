import type { RLSOperation, RLSPolicy } from "../types";

export type CandidatePatch = RLSPolicy & { rationale: string };

export function generatePolicyPatch(pattern: string): CandidatePatch {
  const [role, table, opRaw] = pattern.split(".");
  const operation = (opRaw as RLSOperation) ?? "SELECT";
  return {
    role,
    table,
    operation,
    expression: `has_role('${role}')`,
    rationale: "Generated from repeated runtime violations",
  };
}
