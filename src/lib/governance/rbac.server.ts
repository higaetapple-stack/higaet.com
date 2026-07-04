/**
 * Shared helpers used by the governance server functions:
 * - `assertGovernanceAdmin`: enforces the admin / super_admin roles for every
 *   privileged read, write, and CSV export. Throws Error("Forbidden") — never
 *   returns partial data to a non-admin caller.
 * - `encodeCursor` / `decodeCursor`: composite (created_at, id) cursors that
 *   stay deterministic when many rows share the same second-precision
 *   timestamp (a real risk on high-volume tables like audit logs).
 * - `applyCompositeCursor`: attaches the composite `<` predicate + tiebreak
 *   secondary order onto any Supabase query builder.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertGovernanceAdmin(ctx: { supabase: any; userId: string }): Promise<void> {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type CompositeCursor = { ts: string; id: string };

export function encodeCursor(row: { created_at: string; id: string }): string {
  return `${row.created_at}|${row.id}`;
}

export function decodeCursor(raw: string | undefined | null): CompositeCursor | null {
  if (!raw) return null;
  const [ts, id] = raw.split("|");
  if (!ts || !id) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return { ts, id };
}

/**
 * Applies `(created_at, id) < (cursor.ts, cursor.id)` and a stable
 * `id DESC` tiebreak so pages never overlap or skip rows that share a
 * millisecond timestamp. Pairs with `encodeCursor(lastRow)`.
 */
export function applyCompositeCursor<T>(query: T, cursor: CompositeCursor | null): T {
  const q = query as any;
  q.order("id", { ascending: false });
  if (cursor) {
    // PostgREST `.or()` composes an OR of predicates in one filter param.
    q.or(`created_at.lt.${cursor.ts},and(created_at.eq.${cursor.ts},id.lt.${cursor.id})`);
  }
  return q;
}

/**
 * Convenience wrapper for the common "list-then-paginate" shape used by
 * every governance list endpoint.
 */
export async function paginateList<Row extends { created_at: string; id: string }>(
  builder: any,
  opts: { cursor: CompositeCursor | null; limit: number; withCount: boolean },
): Promise<{ rows: Row[]; nextCursor: string | null; total: number | null }> {
  applyCompositeCursor(builder, opts.cursor);
  const { data, error, count } = await builder;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  const nextCursor = rows.length === opts.limit ? encodeCursor(rows[rows.length - 1]) : null;
  return { rows, nextCursor, total: count ?? null };
}

export type { SupabaseClient };
