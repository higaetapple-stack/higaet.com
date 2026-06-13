import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_ROLES = ["admin", "super_admin"] as const;
const REQUEST_TYPES = ["feature", "change", "enhancement", "consultation", "bug", "other"] as const;
const REQUEST_STATUSES = ["new", "in_review", "approved", "rejected", "in_progress", "completed"] as const;
const TICKET_STATUSES = ["open", "assigned", "in_progress", "waiting_client", "resolved", "closed"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

async function isAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId, _roles: ADMIN_ROLES as unknown as string[],
  });
  return !!data;
}
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  if (!(await isAdmin(ctx))) throw new Error("Forbidden");
}

async function nextTicketNumber(sb: any): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await sb.from("tech_support_tickets")
    .select("ticket_number").ilike("ticket_number", `TKT-${year}-%`)
    .order("ticket_number", { ascending: false }).limit(1);
  const last = data?.[0]?.ticket_number as string | undefined;
  const n = last ? parseInt(last.split("-").pop() || "0", 10) + 1 : 1;
  return `TKT-${year}-${String(n).padStart(4, "0")}`;
}

// ─── Requests (admin) ──────────────────────────────────────────────────────
export const listRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ status: z.enum(REQUEST_STATUSES).optional() })
      .optional().default({}).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("tech_client_requests")
      .select("*, client:client_id(id,company)")
      .order("created_at", { ascending: false }).limit(300);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const requestDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ data: request, error }, comments, attachments] = await Promise.all([
      sb.from("tech_client_requests")
        .select("*, client:client_id(id,company), project:project_id(id,name)")
        .eq("id", data.id).maybeSingle(),
      sb.from("tech_request_comments").select("*").eq("request_id", data.id).order("created_at"),
      sb.from("tech_request_attachments").select("*").eq("request_id", data.id),
    ]);
    if (error) throw new Error(error.message);
    if (!request) throw new Error("Not found");
    return { request, comments: comments.data ?? [], attachments: attachments.data ?? [] };
  });

export const updateRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(REQUEST_STATUSES).optional(),
      priority: z.enum(PRIORITIES).optional(),
      assigned_to: z.string().uuid().nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...patch } = data;
    if (patch.status === "completed" || patch.status === "rejected") {
      (patch as any).resolved_at = new Date().toISOString();
    }
    const { error } = await context.supabase.from("tech_client_requests").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addRequestComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      request_id: z.string().uuid(),
      body: z.string().trim().min(1).max(4000),
      internal: z.boolean().default(false),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tech_request_comments").insert({
      ...data, author_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Tickets (admin) ────────────────────────────────────────────────────────
export const listTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      status: z.enum(TICKET_STATUSES).optional(),
      priority: z.enum(PRIORITIES).optional(),
    }).optional().default({}).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("tech_support_tickets")
      .select("*, client:client_id(id,company)")
      .order("created_at", { ascending: false }).limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.priority) q = q.eq("priority", data.priority);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const ticketDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ data: ticket, error }, comments, attachments] = await Promise.all([
      sb.from("tech_support_tickets")
        .select("*, client:client_id(id,company), project:project_id(id,name)")
        .eq("id", data.id).maybeSingle(),
      sb.from("tech_ticket_comments").select("*").eq("ticket_id", data.id).order("created_at"),
      sb.from("tech_ticket_attachments").select("*").eq("ticket_id", data.id),
    ]);
    if (error) throw new Error(error.message);
    if (!ticket) throw new Error("Not found");
    return { ticket, comments: comments.data ?? [], attachments: attachments.data ?? [] };
  });

export const updateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(TICKET_STATUSES).optional(),
      priority: z.enum(PRIORITIES).optional(),
      assigned_to: z.string().uuid().nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...patch } = data;
    if (patch.status === "resolved") (patch as any).resolved_at = new Date().toISOString();
    if (patch.status === "closed") (patch as any).closed_at = new Date().toISOString();
    const { error } = await context.supabase.from("tech_support_tickets").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addTicketComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ticket_id: z.string().uuid(),
      body: z.string().trim().min(1).max(4000),
      internal: z.boolean().default(false),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tech_ticket_comments").insert({
      ...data, author_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Client portal ──────────────────────────────────────────────────────────
export const myRequestsAndTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: client } = await sb.from("tech_clients").select("id,company")
      .eq("portal_user", context.userId).maybeSingle();
    if (!client) return { client: null, requests: [], tickets: [] };
    const [{ data: requests }, { data: tickets }] = await Promise.all([
      sb.from("tech_client_requests")
        .select("id,type,title,priority,status,created_at")
        .eq("client_id", client.id).order("created_at", { ascending: false }),
      sb.from("tech_support_tickets")
        .select("id,ticket_number,subject,priority,status,created_at")
        .eq("client_id", client.id).order("created_at", { ascending: false }),
    ]);
    return { client, requests: requests ?? [], tickets: tickets ?? [] };
  });

export const submitClientRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      type: z.enum(REQUEST_TYPES).default("feature"),
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(4000).nullable().optional(),
      priority: z.enum(PRIORITIES).default("medium"),
      project_id: z.string().uuid().nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: client } = await sb.from("tech_clients").select("id")
      .eq("portal_user", context.userId).maybeSingle();
    if (!client) throw new Error("Not linked to a client");
    const { error } = await sb.from("tech_client_requests").insert({
      ...data, client_id: client.id, created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitClientTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      subject: z.string().trim().min(1).max(200),
      description: z.string().trim().max(4000).nullable().optional(),
      priority: z.enum(PRIORITIES).default("medium"),
      project_id: z.string().uuid().nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: client } = await sb.from("tech_clients").select("id")
      .eq("portal_user", context.userId).maybeSingle();
    if (!client) throw new Error("Not linked to a client");
    const ticket_number = await nextTicketNumber(sb);
    const { error } = await sb.from("tech_support_tickets").insert({
      ...data, ticket_number, client_id: client.id, created_by: context.userId, status: "open",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// KPIs
export const supportKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [tk, rq] = await Promise.all([
      sb.from("tech_support_tickets").select("status,priority,created_at,resolved_at"),
      sb.from("tech_client_requests").select("status"),
    ]);
    const tickets = tk.data ?? [];
    const requests = rq.data ?? [];
    const open = tickets.filter((t: any) => !["resolved", "closed"].includes(t.status)).length;
    const critical = tickets.filter((t: any) => t.priority === "critical" && t.status !== "closed").length;
    const resolved = tickets.filter((t: any) => t.resolved_at);
    const avgResolutionHrs = resolved.length
      ? resolved.reduce((s: number, t: any) =>
          s + (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 3600000, 0) / resolved.length
      : 0;
    const pendingRequests = requests.filter((r: any) =>
      ["new", "in_review", "in_progress"].includes(r.status)).length;
    return { open, critical, avgResolutionHrs: +avgResolutionHrs.toFixed(1), pendingRequests };
  });
