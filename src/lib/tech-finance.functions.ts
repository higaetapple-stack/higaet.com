import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_ROLES = ["admin", "super_admin"] as const;
const INVOICE_STATUSES = ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"] as const;
const PAYMENT_STATUSES = ["pending", "received", "failed", "refunded"] as const;
const PAYMENT_METHODS = ["bank_transfer", "upi", "card", "cash", "cheque", "other"] as const;

async function isAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ADMIN_ROLES as unknown as string[],
  });
  return !!data;
}
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  if (!(await isAdmin(ctx))) throw new Error("Forbidden");
}

async function nextInvoiceNumber(sb: any): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await sb
    .from("tech_invoices")
    .select("invoice_number")
    .ilike("invoice_number", `INV-${year}-%`)
    .order("invoice_number", { ascending: false })
    .limit(1);
  const last = data?.[0]?.invoice_number as string | undefined;
  const n = last ? parseInt(last.split("-").pop() || "0", 10) + 1 : 1;
  return `INV-${year}-${String(n).padStart(4, "0")}`;
}

// ─── Invoices ──────────────────────────────────────────────────────────────
export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      status: z.enum(INVOICE_STATUSES).optional(),
      client_id: z.string().uuid().optional(),
    }).optional().default({}).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("tech_invoices")
      .select("*, client:client_id(id,company)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.client_id) q = q.eq("client_id", data.client_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const invoiceDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ data: invoice, error }, items, allocs] = await Promise.all([
      sb.from("tech_invoices")
        .select("*, client:client_id(id,company,contact_person,email), contract:contract_id(id,title), project:project_id(id,name)")
        .eq("id", data.id).maybeSingle(),
      sb.from("tech_invoice_items").select("*").eq("invoice_id", data.id).order("position"),
      sb.from("tech_payment_allocations")
        .select("*, payment:payment_id(*)").eq("invoice_id", data.id),
    ]);
    if (error) throw new Error(error.message);
    if (!invoice) throw new Error("Not found");
    return { invoice, items: items.data ?? [], allocations: allocs.data ?? [] };
  });

export const upsertInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      client_id: z.string().uuid(),
      contract_id: z.string().uuid().nullable().optional(),
      project_id: z.string().uuid().nullable().optional(),
      issue_date: z.string().optional(),
      due_date: z.string().nullable().optional(),
      currency: z.string().trim().max(8).optional(),
      tax: z.number().nonnegative().optional(),
      discount: z.number().nonnegative().optional(),
      notes: z.string().max(2000).nullable().optional(),
      payment_instructions: z.string().max(2000).nullable().optional(),
      items: z.array(z.object({
        description: z.string().trim().min(1).max(500),
        quantity: z.number().positive(),
        unit_price: z.number().nonnegative(),
      })).min(1),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { id, items, ...rest } = data;
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
    const total = +(subtotal + (rest.tax ?? 0) - (rest.discount ?? 0)).toFixed(2);
    const base: any = {
      ...rest,
      subtotal: +subtotal.toFixed(2),
      total,
    };
    let invoiceId = id;
    if (id) {
      const { error } = await sb.from("tech_invoices").update(base).eq("id", id);
      if (error) throw new Error(error.message);
      await sb.from("tech_invoice_items").delete().eq("invoice_id", id);
    } else {
      base.invoice_number = await nextInvoiceNumber(sb);
      base.created_by = context.userId;
      const { data: row, error } = await sb.from("tech_invoices").insert(base).select("id").single();
      if (error) throw new Error(error.message);
      invoiceId = row.id;
    }
    const itemRows = items.map((it, idx) => ({
      invoice_id: invoiceId,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      amount: +(it.quantity * it.unit_price).toFixed(2),
      position: idx,
    }));
    const { error: iErr } = await sb.from("tech_invoice_items").insert(itemRows);
    if (iErr) throw new Error(iErr.message);
    return { id: invoiceId };
  });

export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(INVOICE_STATUSES) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: any = { status: data.status };
    if (data.status === "sent") patch.sent_at = new Date().toISOString();
    if (data.status === "paid") patch.paid_at = new Date().toISOString();
    const { error } = await context.supabase.from("tech_invoices").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const generateInvoicePdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [{ data: invoice, error }, items] = await Promise.all([
      sb.from("tech_invoices").select("*, client:client_id(company,contact_person,email)").eq("id", data.id).maybeSingle(),
      sb.from("tech_invoice_items").select("*").eq("invoice_id", data.id).order("position"),
    ]);
    if (error || !invoice) throw new Error(error?.message ?? "Not found");
    const { renderInvoicePdf } = await import("./tech-pdf.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = await renderInvoicePdf({ ...invoice, items: items.data ?? [] });
    const path = `invoices/${invoice.id}/${invoice.invoice_number}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage.from("tech-documents")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(upErr.message);
    await sb.from("tech_invoices").update({ pdf_url: path, pdf_generated_at: new Date().toISOString() }).eq("id", invoice.id);
    return { path };
  });

// ─── Payments ──────────────────────────────────────────────────────────────
export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      status: z.enum(PAYMENT_STATUSES).optional(),
      client_id: z.string().uuid().optional(),
    }).optional().default({}).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("tech_payments")
      .select("*, client:client_id(id,company), allocations:tech_payment_allocations(*, invoice:invoice_id(invoice_number,total))")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.client_id) q = q.eq("client_id", data.client_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(PAYMENT_STATUSES),
      allocations: z.array(z.object({
        invoice_id: z.string().uuid(),
        amount: z.number().positive(),
      })).optional().default([]),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const patch: any = { status: data.status };
    if (data.status === "received") {
      patch.verified_at = new Date().toISOString();
      patch.verified_by = context.userId;
    }
    const { error } = await sb.from("tech_payments").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    if (data.status === "received" && data.allocations.length) {
      await sb.from("tech_payment_allocations").delete().eq("payment_id", data.id);
      const allocRows = data.allocations.map((a) => ({ payment_id: data.id, invoice_id: a.invoice_id, amount: a.amount }));
      const { error: aErr } = await sb.from("tech_payment_allocations").insert(allocRows);
      if (aErr) throw new Error(aErr.message);
      // recalc invoice amount_paid + status
      for (const a of data.allocations) {
        const { data: sums } = await sb
          .from("tech_payment_allocations")
          .select("amount")
          .eq("invoice_id", a.invoice_id);
        const paid = (sums ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
        const { data: inv } = await sb.from("tech_invoices").select("total").eq("id", a.invoice_id).maybeSingle();
        let status = "partially_paid";
        if (inv && paid >= Number(inv.total)) status = "paid";
        await sb.from("tech_invoices").update({
          amount_paid: +paid.toFixed(2),
          status,
          paid_at: status === "paid" ? new Date().toISOString() : null,
        }).eq("id", a.invoice_id);
      }
    }
    return { ok: true };
  });

// ─── Client portal ──────────────────────────────────────────────────────────
export const myFinance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: client } = await sb.from("tech_clients").select("id,company").eq("portal_user", context.userId).maybeSingle();
    if (!client) return { client: null, invoices: [], payments: [] };
    const [{ data: invoices }, { data: payments }] = await Promise.all([
      sb.from("tech_invoices")
        .select("id,invoice_number,status,issue_date,due_date,currency,total,amount_paid,pdf_url,sent_at")
        .eq("client_id", client.id).neq("status", "draft").order("issue_date", { ascending: false }),
      sb.from("tech_payments")
        .select("id,amount,currency,method,reference,paid_on,status,receipt_url,verified_at")
        .eq("client_id", client.id).order("paid_on", { ascending: false }),
    ]);
    return { client, invoices: invoices ?? [], payments: payments ?? [] };
  });

export const submitClientReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      amount: z.number().positive(),
      currency: z.string().trim().max(8).optional(),
      method: z.enum(PAYMENT_METHODS).default("bank_transfer"),
      reference: z.string().trim().max(120).nullable().optional(),
      paid_on: z.string().optional(),
      receipt_url: z.string().trim().max(500).nullable().optional(),
      notes: z.string().trim().max(1000).nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: client } = await sb.from("tech_clients").select("id").eq("portal_user", context.userId).maybeSingle();
    if (!client) throw new Error("Not linked to a client");
    const { error } = await sb.from("tech_payments").insert({
      client_id: client.id,
      amount: data.amount,
      currency: data.currency ?? "USD",
      method: data.method,
      reference: data.reference ?? null,
      paid_on: data.paid_on ?? new Date().toISOString().slice(0, 10),
      receipt_url: data.receipt_url ?? null,
      notes: data.notes ?? null,
      status: "pending",
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// KPIs
export const financeKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [inv, pay] = await Promise.all([
      sb.from("tech_invoices").select("status,total,amount_paid"),
      sb.from("tech_payments").select("status,amount"),
    ]);
    const invoices = inv.data ?? [];
    const payments = pay.data ?? [];
    const outstanding = invoices
      .filter((i: any) => ["sent", "partially_paid", "overdue"].includes(i.status))
      .reduce((s: number, i: any) => s + Number(i.total) - Number(i.amount_paid), 0);
    const paid = invoices
      .filter((i: any) => i.status === "paid")
      .reduce((s: number, i: any) => s + Number(i.total), 0);
    const overdue = invoices.filter((i: any) => i.status === "overdue").length;
    const pendingVerifications = payments.filter((p: any) => p.status === "pending").length;
    return { outstanding, paid, overdue, pendingVerifications };
  });
