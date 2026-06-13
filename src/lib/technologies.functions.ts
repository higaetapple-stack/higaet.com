import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_ROLES = ["admin", "super_admin"] as const;
const CLIENT_STATUSES = [
  "lead", "discovery", "proposal", "approved", "active", "completed", "archived",
] as const;
const PROJECT_STATUSES = [
  "planning", "active", "on_hold", "completed", "cancelled",
] as const;
const MILESTONE_STATUSES = [
  "not_started", "in_progress", "blocked", "done", "cancelled",
] as const;

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

// ─── Clients ────────────────────────────────────────────────────────────────
export const listTechClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ status: z.enum(CLIENT_STATUSES).optional(), q: z.string().trim().max(80).optional() })
      .optional().default({}).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("tech_clients")
      .select("*, owner_profile:profiles!owner(full_name)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.q) q = q.ilike("company", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const techClientDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [{ data: client, error }, projects] = await Promise.all([
      sb.from("tech_clients").select("*, owner_profile:profiles!owner(full_name,email), portal_profile:profiles!portal_user(full_name,email)").eq("id", data.id).maybeSingle(),
      sb.from("tech_projects").select("id,name,status,start_date,end_date").eq("client_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    if (!client) throw new Error("Not found");
    return { client, projects: projects.data ?? [] };
  });

export const upsertTechClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      company: z.string().trim().min(1).max(200),
      contact_person: z.string().trim().max(200).nullable().optional(),
      email: z.string().trim().email().max(200).nullable().optional(),
      phone: z.string().trim().max(50).nullable().optional(),
      industry: z.string().trim().max(80).nullable().optional(),
      website: z.string().trim().max(200).nullable().optional(),
      status: z.enum(CLIENT_STATUSES).optional(),
      owner: z.string().uuid().nullable().optional(),
      portal_user: z.string().uuid().nullable().optional(),
      notes: z.string().trim().max(4000).nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { id, ...patch } = data;
    if (id) {
      const cleaned: any = {};
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) cleaned[k] = v;
      const { error } = await sb.from("tech_clients").update(cleaned).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await sb.from("tech_clients").insert({
      company: patch.company, owner: patch.owner ?? context.userId, status: patch.status ?? "lead",
      contact_person: patch.contact_person ?? null, email: patch.email ?? null, phone: patch.phone ?? null,
      industry: patch.industry ?? null, website: patch.website ?? null, portal_user: patch.portal_user ?? null,
      notes: patch.notes ?? null,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

// ─── Projects ───────────────────────────────────────────────────────────────
export const listTechProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      status: z.enum(PROJECT_STATUSES).optional(),
      client_id: z.string().uuid().optional(),
      mine: z.boolean().optional(),
    }).optional().default({}).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    let q = sb.from("tech_projects")
      .select("id, name, status, start_date, end_date, budget, currency, client:client_id(id,company), pm:profiles!project_manager(full_name)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.client_id) q = q.eq("client_id", data.client_id);
    if (data.mine) q = q.eq("project_manager", context.userId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const techProjectDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ data: project, error }, members, milestones, documents] = await Promise.all([
      sb.from("tech_projects")
        .select("*, client:client_id(id,company,contact_person,email), pm:profiles!project_manager(full_name,email)")
        .eq("id", data.id).maybeSingle(),
      sb.from("tech_project_members").select("*, user:profiles!user_id(full_name,email,avatar_url)").eq("project_id", data.id),
      sb.from("tech_project_milestones").select("*").eq("project_id", data.id).order("order_index", { ascending: true }),
      sb.from("tech_project_documents").select("*, uploader:profiles!uploaded_by(full_name)").eq("project_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Not found");
    return {
      project,
      members: members.data ?? [],
      milestones: milestones.data ?? [],
      documents: documents.data ?? [],
    };
  });

export const upsertTechProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      client_id: z.string().uuid(),
      name: z.string().trim().min(1).max(200),
      description: z.string().trim().max(4000).nullable().optional(),
      status: z.enum(PROJECT_STATUSES).optional(),
      start_date: z.string().nullable().optional(),
      end_date: z.string().nullable().optional(),
      budget: z.number().nullable().optional(),
      currency: z.string().trim().max(8).optional(),
      project_manager: z.string().uuid().nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { id, ...patch } = data;
    if (id) {
      const cleaned: any = {};
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) cleaned[k] = v;
      const { error } = await sb.from("tech_projects").update(cleaned).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await sb.from("tech_projects").insert({
      client_id: patch.client_id, name: patch.name, description: patch.description ?? null,
      status: patch.status ?? "planning", start_date: patch.start_date ?? null, end_date: patch.end_date ?? null,
      budget: patch.budget ?? null, currency: patch.currency ?? "USD",
      project_manager: patch.project_manager ?? context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

// ─── Members ────────────────────────────────────────────────────────────────
export const addProjectMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      project_id: z.string().uuid(),
      user_id: z.string().uuid(),
      role: z.string().trim().max(80).default("Developer"),
      allocation_pct: z.number().int().min(0).max(100).default(100),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tech_project_members").insert({
      project_id: data.project_id, user_id: data.user_id, role: data.role,
      allocation_pct: data.allocation_pct, added_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeProjectMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tech_project_members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Milestones ─────────────────────────────────────────────────────────────
export const upsertMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      project_id: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).nullable().optional(),
      status: z.enum(MILESTONE_STATUSES).optional(),
      due_date: z.string().nullable().optional(),
      completion_pct: z.number().int().min(0).max(100).optional(),
      order_index: z.number().int().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { id, ...patch } = data;
    if (id) {
      const cleaned: any = {};
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) cleaned[k] = v;
      const { error } = await sb.from("tech_project_milestones").update(cleaned).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await sb.from("tech_project_milestones").insert({
      project_id: patch.project_id, title: patch.title, description: patch.description ?? null,
      status: patch.status ?? "not_started", due_date: patch.due_date ?? null,
      completion_pct: patch.completion_pct ?? 0, order_index: patch.order_index ?? 0,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tech_project_milestones").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Documents ──────────────────────────────────────────────────────────────
export const addProjectDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      project_id: z.string().uuid(),
      category: z.string().trim().max(80).optional(),
      file_url: z.string().trim().url().max(500),
      file_name: z.string().trim().max(200).optional(),
      visible_to_client: z.boolean().default(false),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tech_project_documents").insert({
      project_id: data.project_id, category: data.category ?? null,
      file_url: data.file_url, file_name: data.file_name ?? null,
      visible_to_client: data.visible_to_client, uploaded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProjectDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tech_project_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── KPIs ───────────────────────────────────────────────────────────────────
export const techKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [clients, active, completed, planning] = await Promise.all([
      sb.from("tech_clients").select("id", { count: "exact", head: true }),
      sb.from("tech_projects").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("tech_projects").select("id", { count: "exact", head: true }).eq("status", "completed"),
      sb.from("tech_projects").select("id", { count: "exact", head: true }).eq("status", "planning"),
    ]);
    return {
      clients: clients.count ?? 0,
      active: active.count ?? 0,
      completed: completed.count ?? 0,
      planning: planning.count ?? 0,
    };
  });

// ─── Client portal ──────────────────────────────────────────────────────────
export const myClientWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: client } = await sb.from("tech_clients").select("*").eq("portal_user", context.userId).maybeSingle();
    if (!client) return { client: null, projects: [] };
    const { data: projects } = await sb.from("tech_projects")
      .select("id,name,status,start_date,end_date,description")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });
    return { client, projects: projects ?? [] };
  });

export const myClientProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ data: project }, milestones, documents] = await Promise.all([
      sb.from("tech_projects").select("*, client:client_id(company)").eq("id", data.id).maybeSingle(),
      sb.from("tech_project_milestones").select("id,title,description,status,due_date,completion_pct,order_index")
        .eq("project_id", data.id).order("order_index", { ascending: true }),
      sb.from("tech_project_documents").select("id,category,file_url,file_name,created_at")
        .eq("project_id", data.id).eq("visible_to_client", true).order("created_at", { ascending: false }),
    ]);
    if (!project) throw new Error("Not found");
    return { project, milestones: milestones.data ?? [], documents: documents.data ?? [] };
  });
