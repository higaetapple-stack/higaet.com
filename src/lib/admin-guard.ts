import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Shared admin-guard helpers.
 *
 * - assertAdmin: single source of truth for the has_any_role check
 * - assertSameOrigin: CSRF defense-in-depth (server fns are same-origin RPC,
 *   but we still refuse writes when the Origin/Referer does not match Host)
 * - throttle: coarse per-user in-memory rate limit for state-changing endpoints
 * - writeAudit: append to public.audit_logs (never stores secret values)
 *
 * These helpers rely on the request being handled inside a TanStack server
 * function via requireSupabaseAuth middleware.
 */

export async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: allowed, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!allowed) throw new Error("Forbidden");
}

/**
 * Reject requests whose Origin/Referer does not match the server Host.
 * Server functions are same-origin by design, but this check hardens against
 * a browser tab that spoofs custom fetch headers or a proxy misconfiguration.
 */
export function assertSameOrigin() {
  const host = getRequestHeader("host");
  if (!host) return; // node dev sometimes strips; fail-open only when Host is missing
  const origin = getRequestHeader("origin");
  const referer = getRequestHeader("referer");
  const source = origin ?? referer ?? "";
  if (!source) return; // Safari can omit Origin on same-origin POSTs
  try {
    const u = new URL(source);
    if (u.host !== host) {
      throw new Error(`Cross-origin request rejected (origin=${u.host} host=${host})`);
    }
  } catch (e: any) {
    // Only rethrow our own message; ignore URL parse failures.
    if (String(e?.message ?? "").startsWith("Cross-origin")) throw e;
  }
}

/**
 * Coarse per-user in-memory throttle. Worker instances are ephemeral so this
 * is best-effort — good enough to stop click-storms; not a distributed limit.
 */
const throttleMap = new Map<string, number>();
export function throttle(key: string, userId: string, minMs: number) {
  const k = `${key}:${userId}`;
  const last = throttleMap.get(k) ?? 0;
  const now = Date.now();
  if (now - last < minMs) {
    const wait = Math.ceil((minMs - (now - last)) / 1000);
    throw new Error(`Rate limit: try again in ${wait}s`);
  }
  throttleMap.set(k, now);
  // Trim to keep the map bounded.
  if (throttleMap.size > 500) {
    for (const [mk, ts] of throttleMap) {
      if (now - ts > 60_000) throttleMap.delete(mk);
    }
  }
}

export async function writeAudit(
  supabase: any,
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
  } catch {
    // Never let audit failure break the actual admin operation.
  }
}
