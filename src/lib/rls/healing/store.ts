import type { RLSOperation } from "../types";

export type ViolationEvent = {
  role: string;
  table: string;
  operation: RLSOperation;
  timestamp: number;
};

/** In-memory learning buffer. Ephemeral per worker; not for durable state. */
export const violationStore: ViolationEvent[] = [];

export function recordViolation(v: ViolationEvent): void {
  violationStore.push(v);
}

export function clearViolations(): void {
  violationStore.length = 0;
}
