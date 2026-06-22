// API Gateway helpers — verify partner API key, check scopes, log usage.
// Server-only. Used by /api/v1/* route handlers.

import { createHash, randomBytes } from "node:crypto";

export type GatewayContext = {
  apiKeyId: string;
  scopes: string[];
  requestId: string;
};

const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      ...extra,
    },
  });

export function hashApiKey(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function generateApiKey(prefix = "hga_live") {
  const secret = randomBytes(24).toString("base64url");
  const full = `${prefix}_${secret}`;
  return { full, prefix, hash: hashApiKey(full) };
}

export async function verifyApiKey(request: Request, requiredScope?: string) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const authHeader = request.headers.get("authorization") ?? "";
  const presented =
    request.headers.get("x-api-key") ??
    (authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "");

  if (!presented) {
    return { error: json(401, { error: "missing_api_key", request_id: requestId }), requestId };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const hash = hashApiKey(presented);

  const { data: key, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, status, expires_at")
    .eq("key_hash", hash)
    .maybeSingle();

  if (error || !key) {
    return { error: json(401, { error: "invalid_api_key", request_id: requestId }), requestId };
  }
  if (key.status !== "active") {
    return { error: json(401, { error: "key_inactive", request_id: requestId }), requestId };
  }
  if (key.expires_at && new Date(key.expires_at).getTime() < Date.now()) {
    return { error: json(401, { error: "key_expired", request_id: requestId }), requestId };
  }

  const { data: scopeRows } = await supabaseAdmin
    .from("api_key_scopes")
    .select("api_scopes(scope)")
    .eq("api_key_id", key.id);
  const scopes = (scopeRows ?? [])
    .map((r: any) => r.api_scopes?.scope)
    .filter((s: any): s is string => typeof s === "string");

  if (requiredScope && !scopes.includes(requiredScope)) {
    return {
      error: json(403, { error: "scope_missing", required: requiredScope, request_id: requestId }),
      requestId,
    };
  }

  // best-effort last_used_at
  void supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id);

  return {
    ctx: { apiKeyId: key.id, scopes, requestId } satisfies GatewayContext,
    requestId,
  };
}

export async function logApiUsage(opts: {
  apiKeyId: string | null;
  requestId: string;
  request: Request;
  endpoint: string;
  status: number;
  startedAt: number;
  bytesOut?: number;
  error?: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("api_key_usage").insert({
      api_key_id: opts.apiKeyId,
      request_id: opts.requestId,
      endpoint: opts.endpoint,
      method: opts.request.method,
      status_code: opts.status,
      latency_ms: Date.now() - opts.startedAt,
      bytes_out: opts.bytesOut ?? null,
      ip: opts.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: opts.request.headers.get("user-agent") || null,
      error: opts.error ?? null,
    });
  } catch {
    // never fail the request because of logging
  }
}

export function gatewayJson(status: number, body: unknown, requestId: string) {
  return json(status, body, { "x-request-id": requestId });
}

export const corsPreflight = () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization, X-Api-Key, X-Request-Id",
      "access-control-max-age": "86400",
    },
  });
