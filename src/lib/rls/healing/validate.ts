import { simulateAccess } from "../simulate";
import type { CandidatePatch } from "./generate";

export type PatchValidation = {
  safe: boolean;
  result: "ALLOW" | "DENY";
};

export function validatePatch(patch: CandidatePatch): PatchValidation {
  const result = simulateAccess(patch, {
    role: patch.role,
    table: patch.table,
    operation: patch.operation,
  });
  return { safe: result === "ALLOW", result };
}
