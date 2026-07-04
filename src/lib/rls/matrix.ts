import type { AccessMatrix, RLSOperation, RLSPolicy } from "./types";
import { simulateAccess } from "./simulate";

export function buildAccessMatrix(
  policies: RLSPolicy[],
  roles: string[],
  tables: string[],
  operations: RLSOperation[],
): AccessMatrix {
  const matrix: AccessMatrix = {};
  for (const role of roles) {
    matrix[role] = {};
    for (const table of tables) {
      matrix[role][table] = {} as Record<RLSOperation, "ALLOW" | "DENY">;
      for (const op of operations) {
        const allowed = policies
          .filter((p) => p.table === table && p.operation === op)
          .some(
            (p) =>
              simulateAccess(p, { role, table, operation: op }) === "ALLOW",
          );
        matrix[role][table][op] = allowed ? "ALLOW" : "DENY";
      }
    }
  }
  return matrix;
}
