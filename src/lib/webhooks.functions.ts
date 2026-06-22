// Admin-only server fns for webhook subscriptions, deliveries, and replay.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_EVENTS = [
  "certificate.issued",
  "application.submitted",
  "visa.status_changed",
  "job.application_submitted",
  "payment.completed",
  "thread.reply_created",
  "event.created",
] as const;

export const WEBHOOK_EVENT_CATALOG = ALLOWED_EVENTS;

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const [a, s] = await Promise.all([
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" }),
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" }),
  ]);
  if (!(a.data || s.data)) throw new Error("Forbidden");
}

function randomSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "whsec_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const listWebhookSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("api_webhook_subscriptions")
      .select("id, api_key_id, url, event_types, status, last_success_at, last_failure_at, created_at, api_keys(name, partner_name)")
      .order("created_at", { ascending: false });
    return (data ?? []).map((s: any) => ({
      ...s,
      api_key_name: s.api_keys?.name ?? null,
      partner_name: s.api_keys?.partner_name ?? null,
    }));
  });

export const createWebhookSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { api_key_id: string; url: string; event_types: string[] }) => {
    if (!/^https:\/\//i.test(input.url)) throw new Error("URL must use https://");
    const filtered = input.event_types.filter((e) => ALLOWED_EVENTS.includes(e as any) || e === "*");
    if (filtered.length === 0) throw new Error("Pick at least one event");
    return { ...input, event_types: filtered };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const secret = randomSecret();
    const { data: inserted, error } = await supabaseAdmin
      .from("api_webhook_subscriptions")
      .insert({
        api_key_id: data.api_key_id,
        url: data.url,
        event_types: data.event_types,
        signing_secret: secret,
        status: "active",
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "insert failed");
    return { id: inserted.id, signing_secret: secret };
  });

export const updateWebhookSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status?: "active" | "paused" | "disabled"; event_types?: string[] }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { status?: string; event_types?: string[] } = {};
    if (data.status) patch.status = data.status;
    if (data.event_types) patch.event_types = data.event_types.filter((e) => ALLOWED_EVENTS.includes(e as any) || e === "*");
    const { error } = await supabaseAdmin
      .from("api_webhook_subscriptions")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWebhookSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("api_webhook_subscriptions")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listWebhookDeliveries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subscription_id?: string; status?: string } | undefined) => input ?? {})
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("api_webhook_deliveries")
      .select("id, subscription_id, event_type, status, attempt, max_attempts, response_status, error, next_attempt_at, delivered_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.subscription_id) q = q.eq("subscription_id", data.subscription_id);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows } = await q;

    const dayAgo = new Date(Date.now() - 86400_000).toISOString();
    const [{ count: total24 }, { count: success24 }, { count: dead24 }] = await Promise.all([
      supabaseAdmin.from("api_webhook_deliveries").select("id", { head: true, count: "exact" }).gte("created_at", dayAgo),
      supabaseAdmin.from("api_webhook_deliveries").select("id", { head: true, count: "exact" }).gte("created_at", dayAgo).eq("status", "success"),
      supabaseAdmin.from("api_webhook_deliveries").select("id", { head: true, count: "exact" }).gte("created_at", dayAgo).eq("status", "dead"),
    ]);
    return {
      deliveries: rows ?? [],
      total_24h: total24 ?? 0,
      success_24h: success24 ?? 0,
      dead_24h: dead24 ?? 0,
    };
  });

export const redeliverWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("api_webhook_deliveries")
      .update({
        status: "pending",
        next_attempt_at: new Date().toISOString(),
        leased_until: null,
        attempt: 0,
        error: null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const dispatchNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { dispatchPendingWebhooks } = await import("@/lib/webhook-dispatch.server");
    return await dispatchPendingWebhooks();
  });
