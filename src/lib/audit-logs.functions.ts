import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-guard";

const listInput = z.object({
  actorId: z.string().optional().nullable(),
  action: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
  resourceType: z.string().optional().nullable(),
  from: z.string().optional().nullable(),
  to: z.string().optional().nullable(),
  limit: z.number().int().min(1).max(500).optional(),
});

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: JsonValue | null;
  created_at: string;
};

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => listInput.parse(raw ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const limit = data.limit ?? 100;

    let q = context.supabase
      .from("audit_logs")
      .select("id, actor_id, action, resource_type, resource_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data.actorId) q = q.eq("actor_id", data.actorId);
    if (data.action) q = q.ilike("action", `%${data.action}%`);
    if (data.resourceType) q = q.eq("resource_type", data.resourceType);
    if (data.domain) q = q.eq("metadata->>domain", data.domain);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const actorIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.actor_id).filter(Boolean)),
    ) as string[];

    let emailById = new Map<string, string>();
    if (actorIds.length) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, email")
        .in("id", actorIds);
      for (const p of (profs ?? []) as { id: string; email: string | null }[]) {
        if (p.email) emailById.set(p.id, p.email);
      }
    }

    return {
      rows: (rows ?? []).map((r: any): AuditLogRow => ({
        ...r,
        actor_email: r.actor_id ? emailById.get(r.actor_id) ?? null : null,
      })),
    };
  });

export const listAuditFacets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: rows } = await context.supabase
      .from("audit_logs")
      .select("action, resource_type, metadata")
      .order("created_at", { ascending: false })
      .limit(1000);

    const actions = new Set<string>();
    const resourceTypes = new Set<string>();
    const domains = new Set<string>();
    for (const r of (rows ?? []) as any[]) {
      if (r.action) actions.add(r.action);
      if (r.resource_type) resourceTypes.add(r.resource_type);
      const d = r.metadata && typeof r.metadata === "object" ? (r.metadata as any).domain : null;
      if (typeof d === "string" && d) domains.add(d);
    }
    return {
      actions: Array.from(actions).sort(),
      resourceTypes: Array.from(resourceTypes).sort(),
      domains: Array.from(domains).sort(),
    };
  });
