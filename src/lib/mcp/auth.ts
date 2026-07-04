import { isMCPScope, type MCPScope } from "./scopes";

export type MCPClientType = "external" | "admin" | "admin_internal" | "unknown";

export interface MCPAuthContext {
  /** Presented API key, if any. Never log or echo this value. */
  apiKey?: string;
  /** Effective scope for the request (defaults to `public`). */
  scope: MCPScope;
  /** True only for trusted server-to-server calls (shared-secret gated). */
  isAdminInternal: boolean;
  clientType: MCPClientType;
}

/**
 * Extract authentication + scope context from an inbound MCP request.
 *
 * Header contract:
 *   - `x-mcp-api-key`  — API key for external/admin clients
 *   - `x-mcp-scope`    — requested scope; defaults to `public`
 *   - `x-admin-internal: true` + `x-internal-secret: <MCP_ADMIN_INTERNAL_SECRET>`
 *                      — server-only override path; the secret is REQUIRED and
 *                        must match the env var. Without both, the override is
 *                        silently downgraded so external clients can never
 *                        elevate themselves by spoofing a header.
 */
export function authenticateRequest(req: Request): MCPAuthContext {
  const apiKey = req.headers.get("x-mcp-api-key") ?? undefined;

  const rawScope = req.headers.get("x-mcp-scope");
  const scope: MCPScope = isMCPScope(rawScope) ? rawScope : "public";

  const wantsInternal = req.headers.get("x-admin-internal") === "true";
  const presentedSecret = req.headers.get("x-internal-secret") ?? "";
  const expectedSecret = process.env.MCP_ADMIN_INTERNAL_SECRET ?? "";
  const isAdminInternal =
    wantsInternal &&
    expectedSecret.length > 0 &&
    timingSafeEqual(presentedSecret, expectedSecret);

  const validApiKey = isValidApiKey(apiKey);

  const clientType: MCPClientType = isAdminInternal
    ? "admin_internal"
    : validApiKey
      ? "admin"
      : apiKey
        ? "unknown"
        : "external";

  return {
    apiKey: validApiKey ? apiKey : undefined,
    scope,
    isAdminInternal,
    clientType,
  };
}

/**
 * Validate an API key against `MCP_API_KEYS` (comma-separated). Empty env var
 * means "no admin keys configured" — every presented key is rejected.
 */
function isValidApiKey(key: string | undefined): boolean {
  if (!key) return false;
  const configured = (process.env.MCP_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (configured.length === 0) return false;
  return configured.some((candidate) => timingSafeEqual(key, candidate));
}

/** Constant-time string comparison to avoid header-timing side channels. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
