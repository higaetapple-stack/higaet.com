import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PURPOSES = [
  "course_enrollment",
  "program_enrollment",
  "consultation",
  "invoice",
  "proposal",
  "subscription",
  "other",
] as const;

const METHODS = [
  "upi",
  "google_pay",
  "phonepe",
  "paytm",
  "amazon_pay",
  "bank_transfer",
  "paypal",
  "bank_wire",
  "other",
] as const;

export const submitManualPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        amount_minor: z.number().int().nonnegative(),
        currency: z.string().min(3).max(4).default("INR"),
        purpose: z.enum(PURPOSES),
        method: z.enum(METHODS),
        reference: z.string().trim().min(2).max(100),
        proof_url: z.string().trim().max(500).optional(),
        ref_table: z.string().trim().max(60).optional(),
        ref_id: z.string().uuid().optional(),
        payer_notes: z.string().trim().max(1000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        provider: "manual" as never,
        status: "pending_verification" as never,
        amount_minor: data.amount_minor,
        currency: data.currency,
        purpose: data.purpose,
        method: data.method,
        reference: data.reference,
        proof_url: data.proof_url ?? null,
        ref_table: data.ref_table ?? null,
        ref_id: data.ref_id ?? null,
        payer_notes: data.payer_notes ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await notify(supabase, userId, {
      event_type: "payment.submitted",
      title: "Payment Submitted",
      body: "We received your payment proof and will verify it shortly.",
      action_url: "/dashboard/payments/new",
      data: { payment_id: row.id },
    });
    return { id: row.id };
  });

async function notify(
  supabase: any,
  userId: string,
  n: {
    event_type: string;
    title: string;
    body: string;
    action_url?: string;
    data?: Record<string, unknown>;
    priority?: "low" | "normal" | "high";
  },
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      event_type: n.event_type,
      category: "payment",
      title: n.title,
      body: n.body,
      action_url: n.action_url ?? null,
      priority: n.priority ?? "normal",
      data: n.data ?? {},
    });
  } catch {
    // best-effort; never block the payment flow on notification failure
  }
}

export const listMyManualPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id, amount_minor, currency, purpose, status, method, reference, proof_url, ref_table, ref_id, rejection_reason, created_at, verified_at",
      )
      .eq("user_id", userId)
      .eq("provider", "manual")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminListManualPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        status: z
          .enum(["pending_verification", "approved", "rejected", "info_requested", "all"])
          .default("pending_verification"),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("payments")
      .select(
        "id, user_id, amount_minor, currency, purpose, status, method, reference, proof_url, ref_table, ref_id, payer_notes, rejection_reason, created_at, verified_at, verified_by",
      )
      .eq("provider", "manual")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getProofSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ path: z.string().min(1) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("payment-proofs")
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

async function activateForPayment(
  supabase: any,
  payment: {
    user_id: string;
    purpose: string;
    ref_table: string | null;
    ref_id: string | null;
    amount_minor: number;
  },
) {
  // Academy / Hub: enrollments table
  if (
    (payment.purpose === "course_enrollment" || payment.purpose === "program_enrollment") &&
    payment.ref_id
  ) {
    await supabase
      .from("enrollments")
      .upsert(
        {
          student_id: payment.user_id,
          program_id: payment.ref_id,
          status: "active",
        },
        { onConflict: "student_id,program_id" },
      );
    return;
  }
  // Education Hub application
  if (payment.ref_table === "applications" && payment.ref_id) {
    await supabase
      .from("applications")
      .update({ status: "active" })
      .eq("id", payment.ref_id);
    return;
  }
  // Tech invoice settlement
  if (payment.purpose === "invoice" && payment.ref_id) {
    const amount = payment.amount_minor / 100;
    const { data: inv } = await supabase
      .from("tech_invoices")
      .select("total, amount_paid")
      .eq("id", payment.ref_id)
      .maybeSingle();
    if (inv) {
      const newPaid = Number(inv.amount_paid ?? 0) + amount;
      const fullyPaid = newPaid >= Number(inv.total ?? 0);
      await supabase
        .from("tech_invoices")
        .update({
          amount_paid: newPaid,
          status: fullyPaid ? "paid" : "partial",
          paid_at: fullyPaid ? new Date().toISOString() : null,
        })
        .eq("id", payment.ref_id);
    }
  }
}

export const adminApprovePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: payment, error: fetchErr } = await context.supabase
      .from("payments")
      .select("id, user_id, purpose, ref_table, ref_id, amount_minor, status")
      .eq("id", data.id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);
    if (payment.status !== "pending_verification" && payment.status !== "info_requested") {
      throw new Error(`Cannot approve payment in status ${payment.status}`);
    }
    const { error } = await context.supabase
      .from("payments")
      .update({
        status: "approved",
        verified_by: context.userId,
        verified_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    let activation_warning: string | undefined;
    try {
      await activateForPayment(context.supabase, payment);
    } catch (e) {
      activation_warning = (e as Error).message;
    }
    await notify(context.supabase, payment.user_id, {
      event_type: "payment.approved",
      title: "Payment Approved",
      body: "Your payment has been approved and the requested service has been activated.",
      action_url: "/dashboard/payments/new",
      data: { payment_id: payment.id },
      priority: "high",
    });
    return activation_warning ? { ok: true, activation_warning } : { ok: true };
  });

export const adminRejectPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        reason: z.string().trim().min(2).max(500),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("payments")
      .update({
        status: "rejected",
        verified_by: context.userId,
        verified_at: new Date().toISOString(),
        rejection_reason: data.reason,
      })
      .eq("id", data.id)
      .select("user_id")
      .single();
    if (error) throw new Error(error.message);
    await notify(context.supabase, row.user_id, {
      event_type: "payment.rejected",
      title: "Payment Rejected",
      body: `Your payment could not be verified: ${data.reason}`,
      action_url: "/dashboard/payments/new",
      data: { payment_id: data.id, reason: data.reason },
      priority: "high",
    });
    return { ok: true };
  });

export const adminRequestPaymentInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        reason: z.string().trim().min(2).max(500),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("payments")
      .update({
        status: "info_requested",
        rejection_reason: data.reason,
      })
      .eq("id", data.id)
      .select("user_id")
      .single();
    if (error) throw new Error(error.message);
    await notify(context.supabase, row.user_id, {
      event_type: "payment.info_requested",
      title: "More Information Required",
      body: `Additional payment details are required: ${data.reason}`,
      action_url: "/dashboard/payments/new",
      data: { payment_id: data.id, reason: data.reason },
      priority: "high",
    });
    return { ok: true };
  });
