import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Refund lifecycle:
 *   student → requestRefund(payment_id, reason)  → row status='pending'
 *   admin   → adminUpdateRefundStatus(id, ...)   → 'processed' | 'failed'
 *
 * Insert / update use the admin client because the refunds RLS allows only
 * SELECT for the payment owner. Ownership + role are asserted here first.
 */

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const requestRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        payment_id: z.string().uuid(),
        reason: z.string().trim().min(4).max(1000),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Confirm caller owns the payment
    const { data: pay, error: payErr } = await supabase
      .from("payments")
      .select("id, user_id, amount_minor, currency, provider, status")
      .eq("id", data.payment_id)
      .maybeSingle();
    if (payErr) throw new Error(payErr.message);
    if (!pay) throw new Error("Payment not found");
    if (pay.user_id !== userId) throw new Error("Forbidden");
    if (!["approved", "captured", "partially_refunded"].includes(pay.status)) {
      throw new Error("Refunds can only be requested for approved payments.");
    }

    // Reject duplicate open refund
    const { data: existing } = await supabase
      .from("refunds")
      .select("id, status")
      .eq("payment_id", pay.id)
      .in("status", ["pending"]);
    if (existing && existing.length > 0) {
      throw new Error("A refund request is already pending for this payment.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("refunds")
      .insert({
        payment_id: pay.id,
        provider: pay.provider,
        amount_minor: pay.amount_minor,
        currency: pay.currency,
        reason: data.reason,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("crm_activity_log").insert({
      entity_type: "payment",
      entity_id: pay.id,
      event_type: "refund_requested",
      description: data.reason,
      actor_id: userId,
    });

    return { id: row.id };
  });

export const listMyRefunds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("refunds")
      .select("id, payment_id, amount_minor, currency, status, reason, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminListRefunds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        status: z.enum(["pending", "processed", "failed", "all"]).default("pending"),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("refunds")
      .select(
        "id, payment_id, amount_minor, currency, status, reason, provider_refund_id, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminUpdateRefundStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["processed", "failed"]),
        provider_refund_id: z.string().trim().max(200).optional(),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: refund, error: getErr } = await supabaseAdmin
      .from("refunds")
      .select("id, payment_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!refund) throw new Error("Refund not found");
    if (refund.status !== "pending") throw new Error("Refund already resolved.");

    const { error } = await supabaseAdmin
      .from("refunds")
      .update({
        status: data.status,
        provider_refund_id: data.provider_refund_id ?? null,
        notes: data.note ? { admin_note: data.note } : {},
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.status === "processed") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "refunded" })
        .eq("id", refund.payment_id);
    }

    await supabaseAdmin.from("crm_activity_log").insert({
      entity_type: "payment",
      entity_id: refund.payment_id,
      event_type: data.status === "processed" ? "refund_processed" : "refund_failed",
      description: data.note ?? null,
      actor_id: context.userId,
    });

    return { ok: true, payment_id: refund.payment_id };
  });
