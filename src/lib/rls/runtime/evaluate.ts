import type { RLSPolicy } from "../types";
import { simulateAccess } from "../simulate";
import type { DBQueryEvent } from "./observer";

export type RuntimeEvaluation = {
  event: DBQueryEvent;
  expected: boolean;
  actual: true;
  mismatch: "UNEXPECTED_ALLOW" | null;
};

export function evaluateRuntimeAccess(input: {
  event: DBQueryEvent;
  policies: RLSPolicy[];
}): RuntimeEvaluation {
  const { event, policies } = input;
  const applicable = policies.filter(
    (p) =>
      p.table === event.table &&
      p.operation === event.operation &&
      p.role === event.role,
  );
  const expected = applicable.some(
    (p) =>
      simulateAccess(p, {
        role: event.role,
        table: event.table,
        operation: event.operation,
      }) === "ALLOW",
  );
  return {
    event,
    expected,
    actual: true,
    mismatch: expected ? null : "UNEXPECTED_ALLOW",
  };
}
