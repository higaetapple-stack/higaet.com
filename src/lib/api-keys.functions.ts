// Admin-only server fns for managing API keys, scopes, and viewing usage.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const [a, s] = await Promise.all([
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" }),
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" }),
  ]);
  if (!(a.data || s.data)) throw new Error("Forbidden");
}

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: keys } = await supabaseAdmin
      .from("api_keys")
      .select("id, name, key_prefix, status, partner_name, rate_limit_per_minute, last_used_at, expires_at, created_at")
      .order("created_at", { ascending: false });
    const { data: scopeLinks } = await supabaseAdmin
      .from("api_key_scopes")
      .select("api_key_id, api_scopes(scope)");
    const scopesByKey = new Map<string, string[]>();
    (scopeLinks ?? []).forEach((row: any) => {
      const arr = scopesByKey.get(row.api_key_id) ?? [];
      if (row.api_scopes?.scope) arr.push(row.api_scopes.scope);
      scopesByKey.set(row.api_key_id, arr);
    });
    return (keys ?? []).map((k) => ({ ...k, scopes: scopesByKey.get(k.id) ?? [] }));
  });

export const listApiScopes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("api_scopes")
      .select("id, scope, description")
      .order("scope");
    return data ?? [];
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; partner_name?: string; scopes: string[]; rate_limit_per_minute?: number; expires_at?: string | null }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { generateApiKey } = await import("./api-gateway.server");
    const { full, hash } = generateApiKey("hga_live");
    const prefix = full.slice(0, 16); // public-visible prefix incl. type

    const { data: inserted, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        name: data.name,
        partner_name: data.partner_name ?? null,
        key_prefix: prefix,
        key_hash: hash,
        rate_limit_per_minute: data.rate_limit_per_minute ?? 60,
        expires_at: data.expires_at ?? null,
        created_by: context.userId,
        owner_user_id: context.userId,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "insert failed");

    if (data.scopes.length) {
      const { data: scopeRows } = await supabaseAdmin
        .from("api_scopes")
        .select("id, scope")
        .in("scope", data.scopes);
      if (scopeRows?.length) {
        await supabaseAdmin.from("api_key_scopes").insert(
          scopeRows.map((s) => ({ api_key_id: inserted.id, scope_id: s.id })),
        );
      }
    }
    // Return the plaintext secret ONCE.
    return { id: inserted.id, secret: full, prefix };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("api_keys")
      .update({ status: "revoked" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getApiKeyUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string } | undefined) => input ?? {})
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("api_key_usage")
      .select("id, api_key_id, endpoint, method, status_code, latency_ms, created_at, error")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.id) q = q.eq("api_key_id", data.id);
    const { data: rows } = await q;
    const dayAgo = new Date(Date.now() - 86400_000).toISOString();
    const { count: total24 } = await supabaseAdmin
      .from("api_key_usage")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", dayAgo);
    const { count: errors24 } = await supabaseAdmin
      .from("api_key_usage")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", dayAgo)
      .gte("status_code", 400);
    return { recent: rows ?? [], total_24h: total24 ?? 0, errors_24h: errors24 ?? 0 };
  });
