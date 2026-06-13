import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── helpers ────────────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ─── PUBLIC READS (anonymous, via service role) ─────────────────────────────
export const listCountriesPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("countries")
    .select("id,slug,name,iso_code,flag_emoji,summary,hero_image_url,currency,primary_language,popular_intakes,avg_tuition_usd,display_order")
    .eq("published", true)
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCountryPublic = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ slug: z.string() }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: country, error } = await supabaseAdmin
      .from("countries").select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!country) return null;
    const { data: unis } = await supabaseAdmin
      .from("universities")
      .select("id,slug,name,city,world_ranking,avg_tuition_usd,featured,hero_image_url")
      .eq("country_id", country.id).eq("published", true)
      .order("featured", { ascending: false }).order("world_ranking", { ascending: true });
    const { data: schol } = await supabaseAdmin
      .from("scholarships").select("id,slug,name,amount_usd,deadline,coverage")
      .eq("country_id", country.id).eq("published", true).limit(20);
    return { country, universities: unis ?? [], scholarships: schol ?? [] };
  });

export const listUniversitiesPublic = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) =>
    z.object({ country: z.string().optional(), q: z.string().optional() }).optional().default({}).parse(i ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("universities")
      .select("id,slug,name,city,world_ranking,avg_tuition_usd,featured,hero_image_url,countries(slug,name,flag_emoji)")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("world_ranking", { ascending: true })
      .limit(200);
    if (data.country) {
      const { data: c } = await supabaseAdmin.from("countries").select("id").eq("slug", data.country).maybeSingle();
      if (c) q = q.eq("country_id", c.id);
    }
    if (data.q) q = q.ilike("name", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getUniversityPublic = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ slug: z.string() }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: uni, error } = await supabaseAdmin
      .from("universities").select("*,countries(slug,name,flag_emoji)")
      .eq("slug", data.slug).eq("published", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!uni) return null;
    const { data: programs } = await supabaseAdmin
      .from("university_programs").select("*").eq("university_id", uni.id).eq("published", true)
      .order("level", { ascending: true });
    const { data: schol } = await supabaseAdmin
      .from("scholarships").select("id,slug,name,amount_usd,deadline,coverage")
      .eq("university_id", uni.id).eq("published", true);
    return { university: uni, programs: programs ?? [], scholarships: schol ?? [] };
  });

export const listScholarshipsPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("scholarships")
    .select("id,slug,name,amount_usd,coverage,deadline,eligibility,description,apply_url,countries(slug,name,flag_emoji),universities(slug,name)")
    .eq("published", true).order("deadline", { ascending: true, nullsFirst: false }).limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── STUDENT: applications + documents ──────────────────────────────────────
const applicationCreate = z.object({
  university_id: z.string().uuid(),
  program_id: z.string().uuid().optional().nullable(),
  intake: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(4000).optional(),
});
export const createMyApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => applicationCreate.parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: row, error } = await sb.from("applications").insert({
      student_id: context.userId,
      university_id: data.university_id,
      program_id: data.program_id ?? null,
      intake: data.intake ?? null,
      notes: data.notes ?? null,
      status: "lead",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data, error } = await sb.from("applications")
      .select("id,status,intake,created_at,submitted_at,offer_received_at,universities(slug,name,countries(name,flag_emoji)),university_programs(name,level)")
      .eq("student_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: app, error } = await sb.from("applications")
      .select("*,universities(slug,name,city,countries(name,flag_emoji)),university_programs(name,level,duration_months)")
      .eq("id", data.id).eq("student_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!app) return null;
    const { data: docs } = await sb.from("application_documents")
      .select("*").eq("application_id", data.id).order("created_at", { ascending: false });
    return { application: app, documents: docs ?? [] };
  });

export const updateMyApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      intake: z.string().trim().max(60).optional(),
      notes: z.string().trim().max(4000).optional(),
      status: z.enum(["lead", "counseling", "started", "docs_submitted", "submitted"]).optional(),
    }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { id, ...patch } = data;
    const p: any = { ...patch };
    if (p.status === "submitted") p.submitted_at = new Date().toISOString();
    const { error } = await sb.from("applications").update(p).eq("id", id).eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addApplicationDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      application_id: z.string().uuid(),
      doc_type: z.enum(["passport", "transcript", "resume", "sop", "lor", "english_test", "financial", "other"]),
      file_url: z.string().trim().url().max(500),
      file_name: z.string().trim().max(200).optional(),
    }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: existing } = await sb.from("application_documents")
      .select("version").eq("application_id", data.application_id).eq("doc_type", data.doc_type)
      .order("version", { ascending: false }).limit(1).maybeSingle();
    const version = (existing?.version ?? 0) + 1;
    const { error } = await sb.from("application_documents").insert({
      application_id: data.application_id,
      student_id: context.userId,
      doc_type: data.doc_type,
      file_url: data.file_url,
      file_name: data.file_name ?? null,
      version,
      status: "submitted",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApplicationDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { error } = await sb.from("application_documents").delete().eq("id", data.id).eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── ADMIN: countries / universities / programs / scholarships / leads ──────
const countrySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
  iso_code: z.string().trim().max(4).optional(),
  flag_emoji: z.string().trim().max(8).optional(),
  summary: z.string().trim().max(500).optional(),
  description: z.string().trim().max(8000).optional(),
  hero_image_url: z.string().trim().url().optional().or(z.literal("")),
  currency: z.string().trim().max(20).optional(),
  primary_language: z.string().trim().max(120).optional(),
  visa_info: z.string().trim().max(4000).optional(),
  cost_of_living: z.string().trim().max(2000).optional(),
  avg_tuition_usd: z.coerce.number().nonnegative().optional().nullable(),
  display_order: z.coerce.number().int().optional(),
  published: z.boolean().optional(),
});
function clean(o: Record<string, any>) { const x: any = {}; for (const k in o) x[k] = o[k] === "" ? null : o[k]; return x; }

export const adminListCountries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("countries").select("*").order("display_order");
    if (error) throw new Error(error.message); return data ?? [];
  });
export const adminSaveCountry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => countrySchema.extend({ id: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const payload: any = clean(rest); if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
    if (id) {
      const { error } = await context.supabase.from("countries").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("countries").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
export const adminDeleteCountry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("countries").delete().eq("id", data.id);
    if (error) throw new Error(error.message); return { ok: true };
  });

const universitySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
  country_id: z.string().uuid().optional().nullable(),
  city: z.string().trim().max(120).optional(),
  overview: z.string().trim().max(1000).optional(),
  description: z.string().trim().max(8000).optional(),
  hero_image_url: z.string().trim().url().optional().or(z.literal("")),
  logo_url: z.string().trim().url().optional().or(z.literal("")),
  website_url: z.string().trim().url().optional().or(z.literal("")),
  world_ranking: z.coerce.number().int().optional().nullable(),
  avg_tuition_usd: z.coerce.number().nonnegative().optional().nullable(),
  requirements: z.string().trim().max(4000).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});
export const adminListUniversities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("universities")
      .select("*,countries(name,flag_emoji)").order("created_at", { ascending: false });
    if (error) throw new Error(error.message); return data ?? [];
  });
export const adminSaveUniversity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => universitySchema.extend({ id: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const payload: any = clean(rest); if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
    if (id) {
      const { error } = await context.supabase.from("universities").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("universities").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
export const adminDeleteUniversity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("universities").delete().eq("id", data.id);
    if (error) throw new Error(error.message); return { ok: true };
  });

const programSchema = z.object({
  university_id: z.string().uuid(),
  name: z.string().trim().min(1),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
  level: z.enum(["foundation", "diploma", "bachelors", "masters", "phd", "certificate"]),
  field: z.string().trim().max(120).optional(),
  duration_months: z.coerce.number().int().optional().nullable(),
  tuition_usd: z.coerce.number().nonnegative().optional().nullable(),
  requirements: z.string().trim().max(4000).optional(),
  description: z.string().trim().max(8000).optional(),
  published: z.boolean().optional(),
});
export const adminListPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("university_programs")
      .select("*,universities(name,slug)").order("created_at", { ascending: false });
    if (error) throw new Error(error.message); return data ?? [];
  });
export const adminSaveProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => programSchema.extend({ id: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const payload: any = clean(rest); if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
    if (id) {
      const { error } = await context.supabase.from("university_programs").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("university_programs").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
export const adminDeleteProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("university_programs").delete().eq("id", data.id);
    if (error) throw new Error(error.message); return { ok: true };
  });

const scholarshipSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
  country_id: z.string().uuid().optional().nullable(),
  university_id: z.string().uuid().optional().nullable(),
  amount_usd: z.coerce.number().nonnegative().optional().nullable(),
  coverage: z.string().trim().max(200).optional(),
  deadline: z.string().optional().nullable(),
  eligibility: z.string().trim().max(4000).optional(),
  description: z.string().trim().max(8000).optional(),
  apply_url: z.string().trim().url().optional().or(z.literal("")),
  published: z.boolean().optional(),
});
export const adminListScholarships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("scholarships")
      .select("*,countries(name,flag_emoji),universities(name)").order("deadline", { ascending: true });
    if (error) throw new Error(error.message); return data ?? [];
  });
export const adminSaveScholarship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => scholarshipSchema.extend({ id: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const payload: any = clean(rest); if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
    if (id) {
      const { error } = await context.supabase.from("scholarships").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("scholarships").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
export const adminDeleteScholarship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("scholarships").delete().eq("id", data.id);
    if (error) throw new Error(error.message); return { ok: true };
  });

// Lead inbox
export const adminListStudyAbroadLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("study_abroad_leads").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message); return data ?? [];
  });
export const adminUpdateStudyAbroadLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), status: z.string().max(40) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("study_abroad_leads").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message); return { ok: true };
  });
export const adminListTechLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("technologies_leads").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message); return data ?? [];
  });
export const adminUpdateTechLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), status: z.string().max(40) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("technologies_leads").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message); return { ok: true };
  });

// Admin: study-abroad applications inbox
export const adminListSAApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth]).handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("applications")
      .select("id,status,intake,created_at,submitted_at,universities(name,countries(name)),profiles(full_name,email)")
      .order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message); return data ?? [];
  });
export const adminUpdateSAApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["lead", "counseling", "started", "docs_submitted", "submitted", "offer", "rejected", "enrolled"]),
    notes: z.string().max(4000).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: any = { status: data.status };
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.status === "offer") patch.offer_received_at = new Date().toISOString();
    const { error } = await context.supabase.from("applications").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message); return { ok: true };
  });
