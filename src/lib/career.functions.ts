import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const educationItem = z.object({
  school: z.string().max(200),
  degree: z.string().max(200).optional().default(""),
  field: z.string().max(200).optional().default(""),
  start: z.string().max(20).optional().default(""),
  end: z.string().max(20).optional().default(""),
});
const experienceItem = z.object({
  company: z.string().max(200),
  title: z.string().max(200),
  start: z.string().max(20).optional().default(""),
  end: z.string().max(20).optional().default(""),
  summary: z.string().max(2000).optional().default(""),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(120).optional(),
  headline: z.string().trim().max(200).nullable().optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  github_url: z.string().trim().url().max(300).nullable().optional().or(z.literal("")),
  linkedin_url: z.string().trim().url().max(300).nullable().optional().or(z.literal("")),
  website_url: z.string().trim().url().max(300).nullable().optional().or(z.literal("")),
  skills: z.array(z.string().trim().min(1).max(60)).max(60).optional(),
  career_goals: z.string().trim().max(2000).nullable().optional(),
  education: z.array(educationItem).max(20).optional(),
  experience: z.array(experienceItem).max(20).optional(),
});

const portfolioSchema = z.object({
  portfolio_visibility: z.enum(["private", "unlisted", "public"]),
  portfolio_slug: z.string().trim().regex(/^[a-z0-9-]{3,40}$/).optional().nullable(),
  show_email: z.boolean().optional(),
  show_phone: z.boolean().optional(),
  show_resume: z.boolean().optional(),
  show_certificates: z.boolean().optional(),
  show_projects: z.boolean().optional(),
});

const PROFILE_FIELDS =
  "id,email,full_name,phone,avatar_url,headline,bio,location,github_url,linkedin_url,website_url,skills,career_goals,education,experience,portfolio_slug,portfolio_visibility,show_email,show_phone,show_resume,show_certificates,show_projects";

// ─── Career profile ─────────────────────────────────────────────────────────
export const getMyCareerProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data, error } = await sb.from("profiles").select(PROFILE_FIELDS).eq("id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateCareerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) if (v !== undefined) patch[k] = v === "" ? null : v;
    const { error } = await sb.from("profiles").update(patch as any).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updatePortfolioSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => portfolioSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    if (data.portfolio_slug) {
      const { data: clash } = await sb
        .from("profiles")
        .select("id")
        .eq("portfolio_slug", data.portfolio_slug)
        .neq("id", context.userId)
        .maybeSingle();
      if (clash) throw new Error("Handle already taken");
    }
    const { error } = await sb.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Resume DTO ─────────────────────────────────────────────────────────────
export const getMyResumeData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [profileRes, certsRes, projectsRes, enrollRes] = await Promise.all([
      sb.from("profiles").select(PROFILE_FIELDS).eq("id", context.userId).maybeSingle(),
      sb
        .from("certificates")
        .select("id,certificate_number,issued_at,programs(title)")
        .eq("student_id", context.userId)
        .eq("revoked", false)
        .order("issued_at", { ascending: false }),
      sb
        .from("project_submissions")
        .select("id,repo_url,demo_url,summary,status,score,projects(title,programs(title))")
        .eq("student_id", context.userId)
        .in("status", ["passed", "reviewed"]),
      sb
        .from("enrollments")
        .select("status,enrolled_at,programs(title,category)")
        .eq("student_id", context.userId),
    ]);
    if (profileRes.error) throw new Error(profileRes.error.message);
    return {
      profile: profileRes.data,
      certificates: certsRes.data ?? [],
      projects: projectsRes.data ?? [],
      enrollments: enrollRes.data ?? [],
    };
  });

// ─── Jobs (student-facing) ──────────────────────────────────────────────────
const jobFilters = z
  .object({
    q: z.string().trim().max(120).optional(),
    employment_type: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
    remote_type: z.enum(["onsite", "hybrid", "remote"]).optional(),
    experience_level: z.enum(["entry", "mid", "senior"]).optional(),
  })
  .optional()
  .default({});

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => jobFilters.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    let q = sb
      .from("job_postings")
      .select("id,title,slug,location,remote_type,employment_type,experience_level,skills,salary_min,salary_max,salary_currency,posted_at,closes_at,employers(name,slug,logo_url)")
      .eq("status", "open")
      .order("posted_at", { ascending: false, nullsFirst: false });
    if (data.employment_type) q = q.eq("employment_type", data.employment_type);
    if (data.remote_type) q = q.eq("remote_type", data.remote_type);
    if (data.experience_level) q = q.eq("experience_level", data.experience_level);
    if (data.q) q = q.or(`title.ilike.%${data.q}%,description.ilike.%${data.q}%`);
    const { data: rows, error } = await q.limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: job, error } = await sb
      .from("job_postings")
      .select("*,employers(name,slug,logo_url,website,description,industry,hq_location)")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!job) return null;
    const [appRes, savedRes] = await Promise.all([
      sb.from("job_applications").select("id,status,applied_at").eq("job_id", job.id).eq("student_id", context.userId).maybeSingle(),
      sb.from("saved_jobs").select("id").eq("job_id", job.id).eq("student_id", context.userId).maybeSingle(),
    ]);
    return { job, my_application: appRes.data ?? null, saved: !!savedRes.data };
  });

export const applyToJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        cover_letter: z.string().trim().max(5000).optional().default(""),
        portfolio_url: z.string().trim().url().max(300).optional().or(z.literal("")),
        include_resume: z.boolean().optional().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: job, error: jErr } = await sb.from("job_postings").select("id,status").eq("id", data.job_id).maybeSingle();
    if (jErr) throw new Error(jErr.message);
    if (!job || job.status !== "open") throw new Error("Job not open");

    let resume_snapshot: unknown = null;
    if (data.include_resume) {
      const [p, c, pr] = await Promise.all([
        sb.from("profiles").select(PROFILE_FIELDS).eq("id", context.userId).maybeSingle(),
        sb.from("certificates").select("certificate_number,issued_at,programs(title)").eq("student_id", context.userId).eq("revoked", false),
        sb.from("project_submissions").select("repo_url,demo_url,summary,projects(title)").eq("student_id", context.userId).in("status", ["passed", "reviewed"]),
      ]);
      resume_snapshot = { profile: p.data, certificates: c.data ?? [], projects: pr.data ?? [], snapshot_at: new Date().toISOString() };
    }

    const { error } = await sb.from("job_applications").upsert(
      {
        job_id: data.job_id,
        student_id: context.userId,
        cover_letter: data.cover_letter || null,
        portfolio_url: data.portfolio_url || null,
        resume_snapshot,
        status: "submitted",
      },
      { onConflict: "job_id,student_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const withdrawApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { error } = await sb
      .from("job_applications")
      .update({ status: "withdrawn" })
      .eq("id", data.id)
      .eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data, error } = await sb
      .from("job_applications")
      .select("id,status,applied_at,job_postings(id,title,slug,location,employment_type,employers(name,logo_url))")
      .eq("student_id", context.userId)
      .order("applied_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleSaveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ job_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: existing } = await sb
      .from("saved_jobs")
      .select("id")
      .eq("job_id", data.job_id)
      .eq("student_id", context.userId)
      .maybeSingle();
    if (existing) {
      const { error } = await sb.from("saved_jobs").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { saved: false };
    }
    const { error } = await sb.from("saved_jobs").insert({ job_id: data.job_id, student_id: context.userId });
    if (error) throw new Error(error.message);
    return { saved: true };
  });

export const listMySavedJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data, error } = await sb
      .from("saved_jobs")
      .select("id,saved_at,job_postings(id,title,slug,location,employment_type,status,employers(name,logo_url))")
      .eq("student_id", context.userId)
      .order("saved_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
