/**
 * MCP OAuth configuration — validates the issuer + audience derived from
 * `VITE_SUPABASE_PROJECT_ID` at runtime and fails fast with actionable
 * errors when the environment is misconfigured.
 *
 * NOTE: This module is imported by `src/lib/mcp/index.ts` (the defineMcp
 * entry). The entry is module-evaluated both at build time (manifest
 * extraction) and at Worker cold-start, so we NEVER throw at module top
 * level. Instead we expose a builder function that mcp-js can call — its
 * result surfaces the misconfiguration inside the request path, where it
 * becomes a clear 500 rather than a broken build.
 */

const PROJECT_REF_RE = /^[a-z]{20}$/;
const SENTINEL = "project-ref-unset";

export type OAuthEnv = {
  projectRef: string;
  issuer: string;
  acceptedAudiences: string | string[];
};

/**
 * Read + validate the OAuth environment. Returns a rich error object rather
 * than throwing when called at module scope (import-safe); callers that run
 * on the request path should call `assertValidOAuthEnv()` instead.
 */
export function readOAuthEnv(): {
  ok: true;
  env: OAuthEnv;
} | {
  ok: false;
  reason: string;
  hint: string;
} {
  const raw =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string | undefined> }).env
        ?.VITE_SUPABASE_PROJECT_ID) ||
    (typeof process !== "undefined" &&
      process.env?.VITE_SUPABASE_PROJECT_ID) ||
    "";

  if (!raw || raw === SENTINEL) {
    return {
      ok: false,
      reason: "VITE_SUPABASE_PROJECT_ID is not set at build time.",
      hint:
        "Vite inlines this variable at build time. Confirm it is defined " +
        "in the CI kernel build env AND in the Worker deploy env, and that " +
        "the build was NOT run with an empty value. Expected format: a " +
        "20-character lowercase Supabase project ref.",
    };
  }

  if (!PROJECT_REF_RE.test(raw)) {
    return {
      ok: false,
      reason: `VITE_SUPABASE_PROJECT_ID='${raw}' does not match the ` +
        `expected Supabase project-ref format (20 lowercase letters).`,
      hint:
        "The OAuth issuer is derived as https://<ref>.supabase.co/auth/v1. " +
        "A malformed ref will fail RFC 8414 issuer discovery in mcp-js. " +
        "Do NOT use the .lovable.cloud proxy URL — mcp-js rejects it.",
    };
  }

  const issuer = `https://${raw}.supabase.co/auth/v1`;
  const acceptedAudiences = "authenticated" as const;

  // Cheap URL sanity check — catches accidental whitespace/newlines that
  // slip past the regex above via env-file mishaps.
  try {
    // eslint-disable-next-line no-new
    new URL(issuer);
  } catch {
    return {
      ok: false,
      reason: `Derived OAuth issuer '${issuer}' is not a valid URL.`,
      hint: "Check VITE_SUPABASE_PROJECT_ID for stray whitespace or quotes.",
    };
  }

  return {
    ok: true,
    env: { projectRef: raw, issuer, acceptedAudiences },
  };
}

/**
 * Request-path variant: throws a descriptive error when the OAuth env is
 * misconfigured. Safe to call inside tool handlers.
 */
export function assertValidOAuthEnv(): OAuthEnv {
  const r = readOAuthEnv();
  if (!r.ok) {
    throw new Error(
      `[mcp/oauth-config] ${r.reason}\nHint: ${r.hint}`,
    );
  }
  return r.env;
}

/**
 * Module-scope safe accessor. When the env is invalid we return a
 * well-formed sentinel issuer that will never verify a real token — the
 * server still boots (so `/mcp` returns a clean 401 instead of a 500) and
 * an operator-facing warning is emitted once to server logs.
 */
let warned = false;
export function getOAuthConfig(): OAuthEnv {
  const r = readOAuthEnv();
  if (r.ok) return r.env;
  if (!warned) {
    warned = true;
    // eslint-disable-next-line no-console
    console.error(
      `[mcp/oauth-config] MISCONFIGURED — ${r.reason} ${r.hint}`,
    );
  }
  return {
    projectRef: SENTINEL,
    issuer: `https://${SENTINEL}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  };
}
