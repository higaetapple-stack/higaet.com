import type { RLSOperation } from "../types";

export type DBQueryEvent = {
  role: string;
  table: string;
  operation: RLSOperation;
  timestamp: number;
  context?: Record<string, unknown>;
};

type Global = typeof globalThis & { __RLS_AUDIT_QUEUE__?: DBQueryEvent[] };

/**
 * Non-invasive query observation. Never blocks queries.
 * The queue lives on globalThis so it survives across modules in the same worker.
 */
export function observeQuery(event: DBQueryEvent): void {
  const g = globalThis as Global;
  if (!g.__RLS_AUDIT_QUEUE__) g.__RLS_AUDIT_QUEUE__ = [];
  g.__RLS_AUDIT_QUEUE__.push(event);
}

export function drainQueue(): DBQueryEvent[] {
  const g = globalThis as Global;
  const q = g.__RLS_AUDIT_QUEUE__ ?? [];
  g.__RLS_AUDIT_QUEUE__ = [];
  return q;
}
