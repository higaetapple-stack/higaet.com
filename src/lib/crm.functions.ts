import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF_ROLES = ["admin", "super_admin", "counselor", "placement_officer"] as const;
type EntityType =
  | "study_abroad_lead"
  | "tech_lead"
  | "application"
  | "job_application"
  | "placement"
  | "generic_lead";

const ENTITY_TABLE: Record<EntityType, string> = {
  study_abroad_lead: "study_abroad_leads",
  tech_lead: "technologies_leads",
  application: "applications",
  job_application: "job_applications",
  placement: "placements",
  generic_lead: "leads",
};

/** Assignment column per entity. Extracted pure for unit tests. */
export function assignFieldFor(entityType: EntityType): string {
  return entityType === "tech_lead" || entityType === "generic_lead"
    ? "assigned_to"
    : "assigned_to_counselor";
}

export const CRM_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "in_progress",
  "converted",
  "closed",
] as const;

async function assertStaff(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: STAFF_ROLES as unknown as string[],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const crmEntityTypeSchema = z.enum([
  "study_abroad_lead",
  "tech_lead",
  "application",
  "job_application",
  "placement",
  "generic_lead",
]);
const entityTypeSchema = crmEntityTypeSchema;

// ─── Unified inbox ──────────────────────────────────────────────────────────
export const listCrmEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        entity_type: entityTypeSchema.optional(),
        crm_status: z.enum(CRM_STATUSES).optional(),
        search: z.string().optional(),
        assigned_to_me: z.boolean().optional(),
      })
      .optional()
      .default({})
      .parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const types: EntityType[] = data.entity_type
      ? [data.entity_type]
      : (Object.keys(ENTITY_TABLE) as EntityType[]);

    const rows: Array<Record<string, any>> = [];

    for (const type of types) {
      const table = ENTITY_TABLE[type];
      const sel =
        type === "study_abroad_lead"
          ? "id, full_name, email, phone, country_of_interest, crm_status, crm_substatus, assigned_to_counselor, created_at"
          : type === "tech_lead"
            ? "id, full_name, email, phone, company, service_interest, crm_status, crm_substatus, assigned_to, created_at"
            : type === "application"
              ? "id, student_id, university_id, program_id, status, crm_status, crm_substatus, assigned_to_counselor, created_at, profiles:student_id(full_name,email)"
              : type === "generic_lead"
                ? "id, full_name, email, phone, division, source, crm_status, crm_substatus, assigned_to, created_at"
                : type === "job_application"
                  ? "id, student_id, job_id, status, crm_status, crm_substatus, applied_at, profiles:student_id(full_name,email)"
                  : "id, student_id, job_title, status, crm_status, crm_substatus, offer_date, created_at, profiles:student_id(full_name,email)";

      let q = (supabaseAdmin as any).from(table).select(sel).limit(200);
      if (data.crm_status) q = q.eq("crm_status", data.crm_status);
      if (data.assigned_to_me) {
        if (type === "study_abroad_lead" || type === "application")
          q = q.eq("assigned_to_counselor", context.userId);
        else if (type === "tech_lead" || type === "generic_lead")
          q = q.eq("assigned_to", context.userId);
      }
      const { data: list, error } = await q;
      if (error) continue;
      (list ?? []).forEach((r: any) => {
        const name = r.full_name ?? r.profiles?.full_name ?? r.job_title ?? "—";
        const subtitle =
          r.email ??
          r.profiles?.email ??
          r.company ??
          r.country_of_interest ??
          r.service_interest ??
          "";
        rows.push({
          entity_type: type,
          entity_id: r.id,
          name,
          subtitle,
          crm_status: r.crm_status ?? "new",
          crm_substatus: r.crm_substatus ?? null,
          module_status: r.status ?? null,
          created_at: r.created_at ?? r.applied_at ?? r.offer_date ?? null,
        });
      });
    }

    let filtered = rows;
    if (data.search) {
      const s = data.search.toLowerCase();
      filtered = rows.filter(
        (r) => r.name?.toLowerCase().includes(s) || r.subtitle?.toLowerCase().includes(s),
      );
    }
    filtered.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return filtered;
  });

// ─── Entity detail ──────────────────────────────────────────────────────────
export const getCrmEntity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ entity_type: entityTypeSchema, entity_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = ENTITY_TABLE[data.entity_type];
    const { data: entity, error } = await (supabaseAdmin as any)
      .from(table)
      .select("*")
      .eq("id", data.entity_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return entity;
  });

export const updateCrmStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        entity_type: entityTypeSchema,
        entity_id: z.string().uuid(),
        crm_status: z.enum(CRM_STATUSES).optional(),
        crm_substatus: z.string().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = ENTITY_TABLE[data.entity_type];
    const patch: Record<string, any> = {};
    if (data.crm_status !== undefined) patch.crm_status = data.crm_status;
    if (data.crm_substatus !== undefined) patch.crm_substatus = data.crm_substatus;
    const { error } = await (supabaseAdmin as any)
      .from(table)
      .update(patch)
      .eq("id", data.entity_id);
    if (error) throw new Error(error.message);
    await (supabaseAdmin as any).from("crm_activity_log").insert({
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      event_type: "status_changed",
      description: `Status → ${data.crm_status ?? data.crm_substatus}`,
      actor_id: context.userId,
      metadata: patch,
    });
    return { ok: true };
  });

export const assignCounselor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        entity_type: entityTypeSchema,
        entity_id: z.string().uuid(),
        user_id: z.string().uuid().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = ENTITY_TABLE[data.entity_type];
    const field = assignFieldFor(data.entity_type);
    if (data.entity_type === "job_application" || data.entity_type === "placement") {
      throw new Error("Assignment not supported for this entity");
    }
    if (data.user_id) {
      const { data: staff } = await (supabaseAdmin as any)
        .from("user_roles")
        .select("user_id")
        .eq("user_id", data.user_id)
        .in("role", STAFF_ROLES as unknown as string[])
        .limit(1);
      if (!staff || staff.length === 0) throw new Error("Assignee is not staff");
    }
    const { error } = await (supabaseAdmin as any)
      .from(table)
      .update({ [field]: data.user_id })
      .eq("id", data.entity_id);
    if (error) throw new Error(error.message);
    await (supabaseAdmin as any).from("crm_activity_log").insert({
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      event_type: "assigned",
      description: data.user_id ? "Assigned counselor" : "Unassigned",
      actor_id: context.userId,
      metadata: { user_id: data.user_id },
    });
    return { ok: true };
  });

// ─── Notes / Tasks / Follow-ups / Activity ──────────────────────────────────
const polySchema = z.object({
  entity_type: entityTypeSchema,
  entity_id: z.string().uuid(),
});

export const listCrmThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => polySchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const filter = (q: any) =>
      q.eq("entity_type", data.entity_type).eq("entity_id", data.entity_id);
    const [notes, tasks, followUps, activity] = await Promise.all([
      filter(
        (supabaseAdmin as any).from("crm_notes").select("*, author:author_id(full_name)"),
      ).order("created_at", { ascending: false }),
      filter(
        (supabaseAdmin as any).from("crm_tasks").select("*, assignee:assigned_to(full_name)"),
      ).order("due_date", { ascending: true }),
      filter((supabaseAdmin as any).from("crm_follow_ups").select("*")).order("scheduled_at", {
        ascending: true,
      }),
      filter((supabaseAdmin as any).from("crm_activity_log").select("*, actor:actor_id(full_name)"))
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return {
      notes: notes.data ?? [],
      tasks: tasks.data ?? [],
      followUps: followUps.data ?? [],
      activity: activity.data ?? [],
    };
  });

export const addCrmNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => polySchema.extend({ note: z.string().min(1).max(4000) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("crm_notes").insert({
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      author_id: context.userId,
      note: data.note,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCrmTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    polySchema
      .extend({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        assigned_to: z.string().uuid().nullable().optional(),
        due_date: z.string().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("crm_tasks").insert({
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      title: data.title,
      description: data.description,
      assigned_to: data.assigned_to ?? null,
      due_date: data.due_date ?? null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCrmTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
        due_date: z.string().nullable().optional(),
        assigned_to: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, any> = {};
    if (data.status !== undefined) {
      patch.status = data.status;
      patch.completed_at = data.status === "done" ? new Date().toISOString() : null;
    }
    if (data.due_date !== undefined) patch.due_date = data.due_date;
    if (data.assigned_to !== undefined) patch.assigned_to = data.assigned_to;
    const { error } = await (supabaseAdmin as any)
      .from("crm_tasks")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCrmFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    polySchema
      .extend({
        scheduled_at: z.string(),
        channel: z.enum(["email", "phone", "whatsapp", "meeting", "other"]).default("email"),
        notes: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("crm_follow_ups").insert({
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      scheduled_at: data.scheduled_at,
      channel: data.channel,
      notes: data.notes,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCrmFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["scheduled", "done", "missed", "cancelled"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("crm_follow_ups")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listStaffMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await (supabaseAdmin as any)
      .from("user_roles")
      .select("user_id, role")
      .in("role", STAFF_ROLES as unknown as string[]);
    const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
    if (ids.length === 0) return [];
    const { data: profiles } = await (supabaseAdmin as any)
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    return profiles ?? [];
  });
