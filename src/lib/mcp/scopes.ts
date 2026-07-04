/**
 * MCP scope hierarchy.
 *
 * Scopes are ordered by trust level; higher numbers implicitly grant every
 * capability at or below their level. `admin_internal` is the server-only
 * override tier and must never be reachable from an external HTTP client
 * (see `auth.ts` — the `x-admin-internal` header is honored only when the
 * request also carries the server-side shared secret).
 */
export type MCPScope =
  | "public"
  | "insights"
  | "analytics"
  | "sre"
  | "admin"
  | "admin_internal";

export const SCOPE_HIERARCHY: Record<MCPScope, number> = {
  public: 1,
  insights: 2,
  analytics: 3,
  sre: 4,
  admin: 5,
  admin_internal: 6,
};

export function isMCPScope(value: string | undefined | null): value is MCPScope {
  return !!value && Object.prototype.hasOwnProperty.call(SCOPE_HIERARCHY, value);
}
