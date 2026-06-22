import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF_ROLES = ["admin", "super_admin", "counselor", "placement_officer"] as const;

async function assertCounselor(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: STAFF_ROLES as unknown as string[],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

// ─── KPI summary ────────────────────────────────────────────────────────────
export const counselorKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const { start, end } = todayBounds();

    const [leads, apps, openTasks, dueToday, offers] = await Promise.all([
      (supabaseAdmin as any)
        .from("study_abroad_leads")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to_counselor", me),
      (supabaseAdmin as any)
        .from("applications")
        .select("id, status", { count: "exact" })
        .eq("assigned_to_counselor", me),
      (supabaseAdmin as any)
        .from("crm_tasks")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", me)
        .in("status", ["open", "in_progress"]),
      (supabaseAdmin as any)
        .from("crm_follow_ups")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled")
        .gte("scheduled_at", start)
        .lt("scheduled_at", end),
      (supabaseAdmin as any)
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to_counselor", me)
        .eq("status", "offer"),
    ]);

    const appRows = (apps.data ?? []) as Array<{ status: string }>;
    return {
      assigned_leads: leads.count ?? 0,
      assigned_applications: apps.count ?? 0,
      applications_in_progress: appRows.filter((a) =>
        ["counseling", "started", "docs_submitted", "submitted"].includes(a.status),
      ).length,
      open_tasks: openTasks.count ?? 0,
      follow_ups_today: dueToday.count ?? 0,
      offers_received: offers.count ?? 0,
    };
  });

// ─── My leads ───────────────────────────────────────────────────────────────
export const myLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ crm_status: z.string().optional() })
      .optional()
      .default({})
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = (supabaseAdmin as any)
      .from("study_abroad_leads")
      .select(
        "id, full_name, email, phone, country_of_interest, level_of_interest, intake_year, crm_status, crm_substatus, status, created_at",
      )
      .eq("assigned_to_counselor", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.crm_status) q = q.eq("crm_status", data.crm_status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ─── My applications ────────────────────────────────────────────────────────
export const myApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ status: z.string().optional() })
      .optional()
      .default({})
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = (supabaseAdmin as any)
      .from("applications")
      .select(
        "id, status, intake, crm_status, crm_substatus, created_at, profiles:student_id(full_name,email), universities:university_id(name,slug), university_programs:program_id(title)",
      )
      .eq("assigned_to_counselor", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ─── My tasks ───────────────────────────────────────────────────────────────
export const myTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ view: z.enum(["today", "week", "overdue", "all"]).default("all") })
      .optional()
      .default({ view: "all" })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = (supabaseAdmin as any)
      .from("crm_tasks")
      .select("*")
      .eq("assigned_to", context.userId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(300);
    const now = new Date();
    if (data.view === "today") {
      const { start, end } = todayBounds();
      q = q.gte("due_date", start).lt("due_date", end).in("status", ["open", "in_progress"]);
    } else if (data.view === "week") {
      const end = new Date();
      end.setDate(end.getDate() + 7);
      q = q
        .gte("due_date", now.toISOString())
        .lt("due_date", end.toISOString())
        .in("status", ["open", "in_progress"]);
    } else if (data.view === "overdue") {
      q = q.lt("due_date", now.toISOString()).in("status", ["open", "in_progress"]);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ─── My follow-ups ──────────────────────────────────────────────────────────
export const myFollowUps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ view: z.enum(["today", "week", "overdue", "all"]).default("all") })
      .optional()
      .default({ view: "all" })
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Follow-ups belong to entities assigned to this counselor.
    const [{ data: leadIds }, { data: appIds }] = await Promise.all([
      (supabaseAdmin as any)
        .from("study_abroad_leads")
        .select("id")
        .eq("assigned_to_counselor", context.userId),
      (supabaseAdmin as any)
        .from("applications")
        .select("id")
        .eq("assigned_to_counselor", context.userId),
    ]);
    const lids = (leadIds ?? []).map((r: any) => r.id);
    const aids = (appIds ?? []).map((r: any) => r.id);
    if (lids.length === 0 && aids.length === 0) return [];

    const orParts: string[] = [];
    if (lids.length) orParts.push(`and(entity_type.eq.study_abroad_lead,entity_id.in.(${lids.join(",")}))`);
    if (aids.length) orParts.push(`and(entity_type.eq.application,entity_id.in.(${aids.join(",")}))`);

    let q = (supabaseAdmin as any)
      .from("crm_follow_ups")
      .select("*")
      .or(orParts.join(","))
      .order("scheduled_at", { ascending: true })
      .limit(300);

    const now = new Date();
    if (data.view === "today") {
      const { start, end } = todayBounds();
      q = q.gte("scheduled_at", start).lt("scheduled_at", end).eq("status", "scheduled");
    } else if (data.view === "week") {
      const end = new Date();
      end.setDate(end.getDate() + 7);
      q = q.gte("scheduled_at", now.toISOString()).lt("scheduled_at", end.toISOString()).eq("status", "scheduled");
    } else if (data.view === "overdue") {
      q = q.lt("scheduled_at", now.toISOString()).eq("status", "scheduled");
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ─── My activity feed ───────────────────────────────────────────────────────
export const myActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: leadIds }, { data: appIds }] = await Promise.all([
      (supabaseAdmin as any)
        .from("study_abroad_leads")
        .select("id")
        .eq("assigned_to_counselor", context.userId),
      (supabaseAdmin as any)
        .from("applications")
        .select("id")
        .eq("assigned_to_counselor", context.userId),
    ]);
    const lids = (leadIds ?? []).map((r: any) => r.id);
    const aids = (appIds ?? []).map((r: any) => r.id);
    if (lids.length === 0 && aids.length === 0) return [];

    const orParts: string[] = [];
    if (lids.length) orParts.push(`and(entity_type.eq.study_abroad_lead,entity_id.in.(${lids.join(",")}))`);
    if (aids.length) orParts.push(`and(entity_type.eq.application,entity_id.in.(${aids.join(",")}))`);

    const { data, error } = await (supabaseAdmin as any)
      .from("crm_activity_log")
      .select("*, actor:actor_id(full_name)")
      .or(orParts.join(","))
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─── Bulk assign (admin) ────────────────────────────────────────────────────
export const bulkAssignCounselor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        entity_type: z.enum(["study_abroad_lead", "application"]),
        entity_ids: z.array(z.string().uuid()).min(1).max(200),
        counselor_id: z.string().uuid(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.entity_type === "study_abroad_lead" ? "study_abroad_leads" : "applications";

    // Update current pointer
    const { error: upErr } = await (supabaseAdmin as any)
      .from(table)
      .update({ assigned_to_counselor: data.counselor_id })
      .in("id", data.entity_ids);
    if (upErr) throw new Error(upErr.message);

    // Deactivate prior active assignments
    await (supabaseAdmin as any)
      .from("counselor_assignments")
      .update({ active: false, unassigned_at: new Date().toISOString() })
      .eq("entity_type", data.entity_type)
      .in("entity_id", data.entity_ids)
      .eq("active", true);

    // Insert new active assignments + activity entries
    const rows = data.entity_ids.map((eid) => ({
      entity_type: data.entity_type,
      entity_id: eid,
      counselor_id: data.counselor_id,
      assigned_by: context.userId,
    }));
    const { error: insErr } = await (supabaseAdmin as any)
      .from("counselor_assignments")
      .insert(rows);
    if (insErr) throw new Error(insErr.message);

    const activity = data.entity_ids.map((eid) => ({
      entity_type: data.entity_type,
      entity_id: eid,
      event_type: "assigned",
      description: "Counselor assigned (bulk)",
      metadata: { counselor_id: data.counselor_id },
      actor_id: context.userId,
    }));
    await (supabaseAdmin as any).from("crm_activity_log").insert(activity);

    return { ok: true, count: data.entity_ids.length };
  });

// ─── Phase 9B ──────────────────────────────────────────────────────────────
const WORKFLOW_STATUSES = [
  "lead",
  "qualified",
  "documents_pending",
  "application_submitted",
  "offer_received",
  "visa_processing",
  "completed",
  "closed_lost",
] as const;
type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

async function isAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"] as unknown as string[],
  });
  return !!data;
}

// Kanban pipeline for the current counselor (or all when admin & scope=all)
export const counselorPipeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ scope: z.enum(["me", "all"]).default("me") }).optional().default({ scope: "me" }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = await isAdmin(context);
    let q = (supabaseAdmin as any)
      .from("applications")
      .select(
        "id, workflow_status, status, intake, created_at, updated_at, assigned_to_counselor, profiles:student_id(id,full_name,email), universities:university_id(name,slug), university_programs:program_id(name,title)",
      )
      .order("updated_at", { ascending: false })
      .limit(500);
    if (!(admin && data.scope === "all")) q = q.eq("assigned_to_counselor", context.userId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const groups: Record<WorkflowStatus, any[]> = Object.fromEntries(
      WORKFLOW_STATUSES.map((s) => [s, []]),
    ) as any;
    for (const r of rows ?? []) {
      const s = (r.workflow_status ?? "lead") as WorkflowStatus;
      (groups[s] ?? groups.lead).push(r);
    }
    return { statuses: WORKFLOW_STATUSES, groups };
  });

export const setApplicationWorkflowStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        to_status: z.enum(WORKFLOW_STATUSES),
        reason: z.string().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("applications")
      .update({ workflow_status: data.to_status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (data.reason) {
      const { data: latest } = await (supabaseAdmin as any)
        .from("application_status_history")
        .select("id")
        .eq("application_id", data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest?.id) {
        await (supabaseAdmin as any)
          .from("application_status_history")
          .update({ reason: data.reason })
          .eq("id", latest.id);
      }
    }
    return { ok: true };
  });

// Counselor workload (admin: list every counselor; counselor: just self)
export const counselorWorkload = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = await isAdmin(context);

    const { data: roles } = await (supabaseAdmin as any)
      .from("user_roles")
      .select("user_id")
      .in("role", ["counselor", "admin", "super_admin"]);
    const counselorIds: string[] = admin
      ? Array.from(new Set((roles ?? []).map((r: any) => r.user_id)))
      : [context.userId];
    if (counselorIds.length === 0) return [];

    const { data: profiles } = await (supabaseAdmin as any)
      .from("profiles")
      .select("id, full_name, email")
      .in("id", counselorIds);

    const nowIso = new Date().toISOString();
    const rows = await Promise.all(
      counselorIds.map(async (uid) => {
        const [students, apps, docsPending, visa, overdue] = await Promise.all([
          (supabaseAdmin as any)
            .from("counselor_assignments")
            .select("entity_id", { count: "exact", head: true })
            .eq("counselor_id", uid)
            .eq("active", true),
          (supabaseAdmin as any)
            .from("applications")
            .select("id, workflow_status", { count: "exact" })
            .eq("assigned_to_counselor", uid),
          (supabaseAdmin as any)
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("assigned_to_counselor", uid)
            .eq("workflow_status", "documents_pending"),
          (supabaseAdmin as any)
            .from("visa_cases")
            .select("id", { count: "exact", head: true })
            .eq("assigned_counselor", uid)
            .not("status", "in", "(approved,rejected,withdrawn)"),
          (supabaseAdmin as any)
            .from("crm_tasks")
            .select("id", { count: "exact", head: true })
            .eq("assigned_to", uid)
            .in("status", ["open", "in_progress"])
            .lt("due_date", nowIso),
        ]);
        const profile = (profiles ?? []).find((p: any) => p.id === uid);
        const appRows = (apps.data ?? []) as Array<{ workflow_status: string }>;
        const openApps = appRows.filter(
          (a) => !["completed", "closed_lost"].includes(a.workflow_status ?? ""),
        ).length;
        return {
          counselor_id: uid,
          name: profile?.full_name ?? profile?.email ?? "Unknown",
          email: profile?.email,
          students: students.count ?? 0,
          open_applications: openApps,
          documents_pending: docsPending.count ?? 0,
          visa_open: visa.count ?? 0,
          overdue_tasks: overdue.count ?? 0,
        };
      }),
    );
    return rows.sort((a, b) => b.open_applications - a.open_applications);
  });

// Merged student timeline for an application
export const studentTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ application_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error: appErr } = await (supabaseAdmin as any)
      .from("applications")
      .select(
        "id, student_id, workflow_status, status, intake, created_at, profiles:student_id(full_name,email), universities:university_id(name), university_programs:program_id(name,title)",
      )
      .eq("id", data.application_id)
      .single();
    if (appErr) throw new Error(appErr.message);

    const [history, notes, tasks, docs, visa] = await Promise.all([
      (supabaseAdmin as any)
        .from("application_status_history")
        .select("id, from_status, to_status, reason, created_at, changed_by")
        .eq("application_id", data.application_id)
        .order("created_at", { ascending: false }),
      (supabaseAdmin as any)
        .from("crm_notes")
        .select("id, note, created_at, author_id")
        .eq("entity_type", "application")
        .eq("entity_id", data.application_id)
        .order("created_at", { ascending: false }),
      (supabaseAdmin as any)
        .from("crm_tasks")
        .select("id, title, status, due_date, created_at, assigned_to")
        .eq("entity_type", "application")
        .eq("entity_id", data.application_id)
        .order("created_at", { ascending: false }),
      (supabaseAdmin as any)
        .from("application_documents")
        .select("id, document_type, file_name, status, created_at")
        .eq("application_id", data.application_id)
        .order("created_at", { ascending: false }),
      (supabaseAdmin as any)
        .from("visa_cases")
        .select("id, status, visa_type, submitted_at, interview_date, decision_at, created_at, updated_at")
        .eq("application_id", data.application_id)
        .order("created_at", { ascending: false }),
    ]);

    const events: Array<{ ts: string; kind: string; title: string; meta?: any }> = [];
    for (const h of history.data ?? [])
      events.push({
        ts: h.created_at,
        kind: "status",
        title: `Status: ${h.from_status ?? "—"} → ${h.to_status}`,
        meta: { reason: h.reason },
      });
    for (const n of notes.data ?? [])
      events.push({ ts: n.created_at, kind: "note", title: n.note });
    for (const t of tasks.data ?? [])
      events.push({
        ts: t.created_at,
        kind: "task",
        title: `Task: ${t.title}`,
        meta: { status: t.status, due: t.due_date },
      });
    for (const d of docs.data ?? [])
      events.push({
        ts: d.created_at,
        kind: "document",
        title: `Document: ${d.file_name ?? d.document_type}`,
        meta: { status: d.status },
      });
    for (const v of visa.data ?? []) {
      events.push({
        ts: v.created_at,
        kind: "visa",
        title: `Visa case opened (${v.visa_type ?? "—"})`,
        meta: { status: v.status },
      });
      if (v.submitted_at)
        events.push({ ts: v.submitted_at, kind: "visa", title: "Visa submitted" });
      if (v.interview_date)
        events.push({ ts: v.interview_date, kind: "visa", title: "Visa interview scheduled" });
      if (v.decision_at)
        events.push({ ts: v.decision_at, kind: "visa", title: `Visa decision: ${v.status}` });
    }
    events.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return { application: app, events };
  });

// Counselor analytics
export const counselorAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCounselor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = await isAdmin(context);

    let appQ = (supabaseAdmin as any)
      .from("applications")
      .select("id, workflow_status, assigned_to_counselor, created_at, updated_at")
      .limit(5000);
    if (!admin) appQ = appQ.eq("assigned_to_counselor", context.userId);
    const { data: apps, error } = await appQ;
    if (error) throw new Error(error.message);

    const byStatus: Record<string, number> = {};
    const byCounselor: Record<string, number> = {};
    for (const a of apps ?? []) {
      const s = a.workflow_status ?? "lead";
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      const c = a.assigned_to_counselor ?? "unassigned";
      byCounselor[c] = (byCounselor[c] ?? 0) + 1;
    }
    const total = (apps ?? []).length || 1;
    const qualified = (apps ?? []).filter(
      (a: any) => !["lead", "closed_lost"].includes(a.workflow_status ?? ""),
    ).length;
    const offers = (apps ?? []).filter((a: any) =>
      ["offer_received", "visa_processing", "completed"].includes(a.workflow_status ?? ""),
    ).length;
    const completed = (apps ?? []).filter((a: any) => a.workflow_status === "completed").length;

    // Visa
    let visaQ = (supabaseAdmin as any).from("visa_cases").select("status,assigned_counselor").limit(5000);
    if (!admin) visaQ = visaQ.eq("assigned_counselor", context.userId);
    const { data: visa } = await visaQ;
    const visaTotal = (visa ?? []).length || 1;
    const visaApproved = (visa ?? []).filter((v: any) => v.status === "approved").length;

    // Avg days in stage (history-based, approximate)
    const { data: history } = await (supabaseAdmin as any)
      .from("application_status_history")
      .select("application_id, to_status, created_at")
      .order("created_at", { ascending: true })
      .limit(10000);
    const stageDurations: Record<string, number[]> = {};
    const lastByApp: Record<string, { status: string; ts: number }> = {};
    for (const h of history ?? []) {
      const ts = new Date(h.created_at).getTime();
      const prev = lastByApp[h.application_id];
      if (prev) {
        const days = (ts - prev.ts) / 86400000;
        (stageDurations[prev.status] ??= []).push(days);
      }
      lastByApp[h.application_id] = { status: h.to_status, ts };
    }
    const avgDaysInStage = Object.fromEntries(
      Object.entries(stageDurations).map(([s, arr]) => [
        s,
        Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10,
      ]),
    );

    return {
      by_status: byStatus,
      by_counselor: byCounselor,
      conversion_rate: Math.round((qualified / total) * 1000) / 10,
      offer_rate: Math.round((offers / total) * 1000) / 10,
      completion_rate: Math.round((completed / total) * 1000) / 10,
      visa_success_rate: Math.round((visaApproved / visaTotal) * 1000) / 10,
      avg_days_in_stage: avgDaysInStage,
      total_applications: (apps ?? []).length,
    };
  });
