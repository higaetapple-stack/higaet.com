import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin", "placement_officer"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// ─── Employers ──────────────────────────────────────────────────────────────
const employerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/).optional(),
  website: z.string().trim().url().max(300).optional().or(z.literal("")),
  logo_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional(),
  industry: z.string().trim().max(120).optional(),
  hq_location: z.string().trim().max(200).optional(),
  size: z.string().trim().max(60).optional(),
  verified: z.boolean().optional(),
});

export const adminListEmployers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("employers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCreateEmployer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => employerSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const payload: any = { ...data, slug: data.slug || slugify(data.name), created_by: context.userId };
    for (const k of Object.keys(payload)) if (payload[k] === "") payload[k] = null;
    const { data: row, error } = await context.supabase.from("employers").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminUpdateEmployer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => employerSchema.partial().extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { id, ...rest } = data;
    const patch: any = { ...rest };
    for (const k of Object.keys(patch)) if (patch[k] === "") patch[k] = null;
    const { error } = await context.supabase.from("employers").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteEmployer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("employers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Jobs ───────────────────────────────────────────────────────────────────
const jobSchema = z.object({
  employer_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,120}$/).optional(),
  description: z.string().trim().min(1).max(10000),
  requirements: z.string().trim().max(10000).optional(),
  responsibilities: z.string().trim().max(10000).optional(),
  location: z.string().trim().max(200).optional(),
  remote_type: z.enum(["onsite", "hybrid", "remote"]).default("onsite"),
  employment_type: z.enum(["full_time", "part_time", "contract", "internship"]).default("full_time"),
  experience_level: z.enum(["entry", "mid", "senior"]).default("entry"),
  salary_min: z.number().int().nonnegative().optional().nullable(),
  salary_max: z.number().int().nonnegative().optional().nullable(),
  salary_currency: z.string().trim().max(8).default("INR"),
  skills: z.array(z.string().trim().min(1).max(60)).max(40).optional(),
  apply_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  status: z.enum(["draft", "open", "closed", "archived"]).default("draft"),
  closes_at: z.string().datetime().optional().nullable(),
});

export const adminListJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("job_postings")
      .select("*,employers(name,slug,logo_url)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCreateJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => jobSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const payload: any = {
      ...data,
      slug: data.slug || slugify(data.title) + "-" + Math.random().toString(36).slice(2, 7),
      created_by: context.userId,
      posted_at: data.status === "open" ? new Date().toISOString() : null,
    };
    if (payload.apply_url === "") payload.apply_url = null;
    const { data: row, error } = await context.supabase.from("job_postings").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminUpdateJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => jobSchema.partial().extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { id, ...rest } = data;
    const patch: any = { ...rest };
    if (patch.apply_url === "") patch.apply_url = null;
    if (patch.status === "open" && !patch.posted_at) patch.posted_at = new Date().toISOString();
    const { error } = await context.supabase.from("job_postings").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminArchiveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("job_postings").update({ status: "archived" }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Applications ───────────────────────────────────────────────────────────
export const adminListApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ job_id: z.string().uuid().optional() }).optional().default({}).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    let q = context.supabase
      .from("job_applications")
      .select(
        "id,status,applied_at,cover_letter,portfolio_url,notes,job_postings(id,title,slug,employers(name)),profiles(id,full_name,email,portfolio_slug)",
      )
      .order("applied_at", { ascending: false });
    if (data.job_id) q = q.eq("job_id", data.job_id);
    const { data: rows, error } = await q.limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminUpdateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["submitted", "under_review", "shortlisted", "rejected", "withdrawn", "hired"]),
        notes: z.string().trim().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const patch: any = { status: data.status };
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await context.supabase.from("job_applications").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
