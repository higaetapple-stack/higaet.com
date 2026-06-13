import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF_ROLES = ["admin", "super_admin", "counselor"] as const;
const VISA_STATUSES = [
  "draft",
  "documents_pending",
  "ready_to_submit",
  "submitted",
  "interview_scheduled",
  "administrative_processing",
  "approved",
  "rejected",
  "closed",
] as const;
const DOC_TYPES = [
  "passport",
  "offer_letter",
  "financial_proof",
  "medical",
  "visa_form",
  "photo",
  "english_test",
  "other",
] as const;

async function isStaff(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: STAFF_ROLES as unknown as string[],
  });
  return !!data;
}
async function assertStaff(ctx: { supabase: any; userId: string }) {
  if (!(await isStaff(ctx))) throw new Error("Forbidden");
}

// ─── Student views ──────────────────────────────────────────────────────────
export const myVisaCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("visa_cases")
      .select("*, countries:country_id(name,slug,flag_emoji)")
      .eq("student_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const visaCaseDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: vc, error } = await sb
      .from("visa_cases")
      .select(
        "*, countries:country_id(name,slug,flag_emoji), counselor:assigned_counselor(full_name,email), student:student_id(full_name,email)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!vc) throw new Error("Not found");

    const [docs, history] = await Promise.all([
      sb.from("visa_documents").select("*").eq("visa_case_id", data.id).order("uploaded_at", { ascending: false }),
      sb
        .from("visa_status_history")
        .select("*, actor:changed_by(full_name)")
        .eq("visa_case_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    return { case: vc, documents: docs.data ?? [], history: history.data ?? [] };
  });

export const addVisaDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        visa_case_id: z.string().uuid(),
        document_type: z.enum(DOC_TYPES),
        file_url: z.string().trim().url().max(500),
        file_name: z.string().trim().max(200).optional(),
        notes: z.string().trim().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("visa_documents").insert({
      visa_case_id: data.visa_case_id,
      document_type: data.document_type,
      file_url: data.file_url,
      file_name: data.file_name ?? null,
      notes: data.notes ?? null,
      uploaded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("crm_activity_log").insert({
      entity_type: "visa_case",
      entity_id: data.visa_case_id,
      event_type: "document_uploaded",
      description: `Document uploaded: ${data.document_type}`,
      actor_id: context.userId,
    });
    return { ok: true };
  });

export const deleteVisaDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("visa_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Staff: list / KPIs ─────────────────────────────────────────────────────
export const listVisaCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        status: z.enum(VISA_STATUSES).optional(),
        assigned_to_me: z.boolean().optional(),
        q: z.string().trim().max(80).optional(),
      })
      .optional()
      .default({})
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    let q = context.supabase
      .from("visa_cases")
      .select(
        "id, status, visa_type, interview_date, submitted_at, decision_at, created_at, student:student_id(full_name,email), countries:country_id(name,flag_emoji), counselor:assigned_counselor(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.assigned_to_me) q = q.eq("assigned_counselor", context.userId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    let filtered = rows ?? [];
    if (data.q) {
      const needle = data.q.toLowerCase();
      filtered = filtered.filter(
        (r: any) =>
          r.student?.full_name?.toLowerCase().includes(needle) ||
          r.student?.email?.toLowerCase().includes(needle),
      );
    }
    return filtered;
  });

export const visaKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ mine: z.boolean().optional() }).optional().default({}).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const base = () => {
      let q = context.supabase.from("visa_cases").select("id", { count: "exact", head: true });
      if (data.mine) q = q.eq("assigned_counselor", context.userId);
      return q;
    };
    const [open, docsPending, submitted, interview, approved, rejected] = await Promise.all([
      base().not("status", "in", "(approved,rejected,closed)"),
      base().eq("status", "documents_pending"),
      base().eq("status", "submitted"),
      base().eq("status", "interview_scheduled"),
      base().eq("status", "approved"),
      base().eq("status", "rejected"),
    ]);
    return {
      open: open.count ?? 0,
      documents_pending: docsPending.count ?? 0,
      submitted: submitted.count ?? 0,
      interview_scheduled: interview.count ?? 0,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
    };
  });

// ─── Staff: create / update ─────────────────────────────────────────────────
export const createVisaCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        student_id: z.string().uuid(),
        application_id: z.string().uuid().optional(),
        country_id: z.string().uuid().optional(),
        visa_type: z.string().trim().max(80).optional(),
        assigned_counselor: z.string().uuid().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { data: row, error } = await context.supabase
      .from("visa_cases")
      .insert({
        student_id: data.student_id,
        application_id: data.application_id ?? null,
        country_id: data.country_id ?? null,
        visa_type: data.visa_type ?? null,
        assigned_counselor: data.assigned_counselor ?? context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("crm_activity_log").insert({
      entity_type: "visa_case",
      entity_id: row.id,
      event_type: "created",
      description: "Visa case created",
      actor_id: context.userId,
    });
    return { id: row.id };
  });

export const updateVisaCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(VISA_STATUSES).optional(),
        visa_type: z.string().trim().max(80).nullable().optional(),
        assigned_counselor: z.string().uuid().nullable().optional(),
        interview_date: z.string().nullable().optional(),
        interview_time: z.string().nullable().optional(),
        interview_location: z.string().trim().max(200).nullable().optional(),
        interview_notes: z.string().trim().max(2000).nullable().optional(),
        notes: z.string().trim().max(4000).nullable().optional(),
        submitted_at: z.string().nullable().optional(),
        decision_at: z.string().nullable().optional(),
        status_note: z.string().trim().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const sb = context.supabase;
    const { id, status_note, ...patch } = data;

    // Detect status change
    let prevStatus: string | null = null;
    let interviewWasUnset = false;
    if (status || patch.interview_date) {
      const { data: prev } = await sb
        .from("visa_cases")
        .select("status, interview_date")
        .eq("id", id)
        .maybeSingle();
      prevStatus = prev?.status ?? null;
      interviewWasUnset = !prev?.interview_date;
    }

    const cleaned: any = {};
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) cleaned[k] = v;

    // Auto-stamp submitted_at / decision_at
    if (patch.status === "submitted" && !cleaned.submitted_at) cleaned.submitted_at = new Date().toISOString();
    if ((patch.status === "approved" || patch.status === "rejected") && !cleaned.decision_at)
      cleaned.decision_at = new Date().toISOString();

    const { error } = await sb.from("visa_cases").update(cleaned).eq("id", id);
    if (error) throw new Error(error.message);

    // Status history + activity
    if (patch.status && patch.status !== prevStatus) {
      await sb.from("visa_status_history").insert({
        visa_case_id: id,
        old_status: prevStatus,
        new_status: patch.status,
        changed_by: context.userId,
        notes: status_note ?? null,
      });
      await sb.from("crm_activity_log").insert({
        entity_type: "visa_case",
        entity_id: id,
        event_type: `status_${patch.status}`,
        description: `Status changed to ${patch.status}`,
        actor_id: context.userId,
      });
    }

    // Auto follow-ups when interview newly scheduled
    if (patch.interview_date && interviewWasUnset) {
      const day = new Date(patch.interview_date + "T09:00:00Z");
      const mk = (offsetDays: number, label: string) => ({
        entity_type: "visa_case",
        entity_id: id,
        scheduled_at: new Date(day.getTime() - offsetDays * 86400000).toISOString(),
        channel: "reminder",
        status: "scheduled",
        notes: label,
        created_by: context.userId,
      });
      await sb.from("crm_follow_ups").insert([
        mk(7, "Visa interview in 7 days"),
        mk(1, "Visa interview tomorrow"),
        mk(0, "Visa interview today"),
      ]);
      await sb.from("crm_activity_log").insert({
        entity_type: "visa_case",
        entity_id: id,
        event_type: "interview_scheduled",
        description: `Interview scheduled for ${patch.interview_date}`,
        actor_id: context.userId,
      });
    }

    return { ok: true };

    // unused guard reference, keep linter happy
    function status() { return patch.status; }
  });

export const verifyVisaDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), verified: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase
      .from("visa_documents")
      .update({
        verified: data.verified,
        verified_by: data.verified ? context.userId : null,
        verified_at: data.verified ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
