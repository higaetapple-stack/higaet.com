import type { RLSOperation } from "../types";

export type AccessEvent = {
  role: string;
  table: string;
  action: RLSOperation;
  result: "ALLOW" | "DENY";
  timestamp: number;
};

export const accessLog: AccessEvent[] = [];

export function recordAccess(event: AccessEvent): void {
  accessLog.push(event);
}

export function clearAccessLog(): void {
  accessLog.length = 0;
}
