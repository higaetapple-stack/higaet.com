import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyEducationProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data, error } = await sb
      .from("profiles")
      .select("id,full_name,email,phone,location,headline,bio,linkedin_url,website_url,avatar_url")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyEducationProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        full_name: z.string().trim().max(120).optional(),
        phone: z.string().trim().max(40).optional(),
        location: z.string().trim().max(120).optional(),
        headline: z.string().trim().max(200).optional(),
        bio: z.string().trim().max(2000).optional(),
        linkedin_url: z.string().trim().url().optional().or(z.literal("")),
        website_url: z.string().trim().url().optional().or(z.literal("")),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) payload[k] = v === "" ? null : v;
    const { error } = await sb.from("profiles").update(payload as never).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyAllDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data, error } = await sb
      .from("application_documents")
      .select("id,doc_type,file_name,file_url,version,status,created_at,application_id,applications(id,universities(name))")
      .eq("student_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getApplicationStatusHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ application_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: rows, error } = await sb
      .from("application_status_history")
      .select("id,from_status,to_status,reason,created_at,changed_by")
      .eq("application_id", data.application_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyEducationSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [apps, docs] = await Promise.all([
      sb
        .from("applications")
        .select("id,workflow_status,intake,updated_at,universities(name,countries(flag_emoji))")
        .eq("student_id", context.userId)
        .order("updated_at", { ascending: false }),
      sb
        .from("application_documents")
        .select("id", { count: "exact", head: true })
        .eq("student_id", context.userId),
    ]);
    const byStatus: Record<string, number> = {};
    for (const a of apps.data ?? []) {
      const s = (a as { workflow_status: string }).workflow_status;
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    return {
      applications: apps.data ?? [],
      docCount: docs.count ?? 0,
      byStatus,
    };
  });
