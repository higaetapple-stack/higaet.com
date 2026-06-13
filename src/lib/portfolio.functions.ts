import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPublicPortfolio = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(60) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id,full_name,email,phone,avatar_url,headline,bio,location,github_url,linkedin_url,website_url,skills,career_goals,education,experience,portfolio_slug,portfolio_visibility,show_email,show_phone,show_resume,show_certificates,show_projects",
      )
      .eq("portfolio_slug", data.slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!profile || profile.portfolio_visibility === "private") return null;

    const [certs, projects] = await Promise.all([
      profile.show_certificates
        ? supabaseAdmin
            .from("certificates")
            .select("id,certificate_number,issued_at,programs(title,category)")
            .eq("student_id", profile.id)
            .eq("revoked", false)
            .order("issued_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      profile.show_projects
        ? supabaseAdmin
            .from("project_submissions")
            .select("id,repo_url,demo_url,summary,projects(title,brief)")
            .eq("student_id", profile.id)
            .in("status", ["passed", "reviewed"])
        : Promise.resolve({ data: [] as any[] }),
    ]);

    return {
      visibility: profile.portfolio_visibility,
      slug: profile.portfolio_slug,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      skills: profile.skills ?? [],
      education: profile.education ?? [],
      experience: profile.experience ?? [],
      career_goals: profile.career_goals,
      github_url: profile.github_url,
      linkedin_url: profile.linkedin_url,
      website_url: profile.website_url,
      email: profile.show_email ? profile.email : null,
      phone: profile.show_phone ? profile.phone : null,
      show_resume: profile.show_resume,
      certificates: certs.data ?? [],
      projects: projects.data ?? [],
    };
  });

// Public, anonymous job board reads
const jobFilters = z
  .object({
    q: z.string().trim().max(120).optional(),
    employment_type: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
    remote_type: z.enum(["onsite", "hybrid", "remote"]).optional(),
    experience_level: z.enum(["entry", "mid", "senior"]).optional(),
  })
  .optional()
  .default({});

export const listPublicJobs = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => jobFilters.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("job_postings")
      .select(
        "id,title,slug,location,remote_type,employment_type,experience_level,skills,salary_min,salary_max,salary_currency,posted_at,closes_at,employers(name,slug,logo_url)",
      )
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

export const getPublicJob = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job, error } = await supabaseAdmin
      .from("job_postings")
      .select("*,employers(name,slug,logo_url,website,description,industry,hq_location)")
      .eq("slug", data.slug)
      .eq("status", "open")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return job;
  });
