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
