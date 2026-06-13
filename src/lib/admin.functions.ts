import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "./auth.functions";

// ─────────────────────────────────────────────────────────────────────────────
// Shared: ensure caller is admin/super_admin (server-side gate)
// ─────────────────────────────────────────────────────────────────────────────
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAMS
// ─────────────────────────────────────────────────────────────────────────────
const PROGRAM_CATEGORIES = [
  "ai_engineering",
  "gen_ai",
  "ai_agents",
  "ai_automation",
  "prompt_engineering",
  "fullstack_ai",
  "data_science",
  "cyber_security",
  "cloud_computing",
  "study_abroad",
  "corporate_training",
] as const;
export type ProgramCategory = (typeof PROGRAM_CATEGORIES)[number];
export const programCategories = PROGRAM_CATEGORIES;

const PROGRAM_STATUSES = ["draft", "published", "archived"] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

const ProgramInput = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2).max(200),
  category: z.enum(PROGRAM_CATEGORIES),
  level: z.string().trim().max(60).optional().or(z.literal("")),
  format: z.string().trim().max(60).optional().or(z.literal("")),
  duration: z.string().trim().max(60).optional().or(z.literal("")),
  fee_inr: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  thumbnail_url: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(PROGRAM_STATUSES).default("draft"),
  featured: z.boolean().default(false),
});

export const listPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProgram = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("programs")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const createProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ProgramInput>) => ProgramInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("programs")
      .insert({
        slug: data.slug,
        title: data.title,
        category: data.category,
        level: data.level || null,
        format: data.format || null,
        duration: data.duration || null,
        fee_inr: data.fee_inr || null,
        description: data.description || null,
        thumbnail_url: data.thumbnail_url || null,
        status: data.status,
        featured: data.featured,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string } & z.infer<typeof ProgramInput>) =>
    z.object({ id: z.string().uuid() }).merge(ProgramInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("programs")
      .update({
        slug: rest.slug,
        title: rest.title,
        category: rest.category,
        level: rest.level || null,
        format: rest.format || null,
        duration: rest.duration || null,
        fee_inr: rest.fee_inr || null,
        description: rest.description || null,
        thumbnail_url: rest.thumbnail_url || null,
        status: rest.status,
        featured: rest.featured,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("programs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────────────────────────────────────────
const COURSE_STATUSES = ["draft", "published", "archived"] as const;
const CourseInput = z.object({
  program_id: z.string().uuid(),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  order_no: z.number().int().min(0).default(0),
  status: z.enum(COURSE_STATUSES).default("draft"),
});

export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { program_id: string }) => z.object({ program_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("courses")
      .select("*")
      .eq("program_id", data.program_id)
      .order("order_no", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof CourseInput>) => CourseInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("courses")
      .insert({
        program_id: data.program_id,
        slug: data.slug,
        title: data.title,
        description: data.description || null,
        order_no: data.order_no,
        status: data.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string } & z.infer<typeof CourseInput>) =>
    z.object({ id: z.string().uuid() }).merge(CourseInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("courses")
      .update({
        slug: rest.slug,
        title: rest.title,
        description: rest.description || null,
        order_no: rest.order_no,
        status: rest.status,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS
// ─────────────────────────────────────────────────────────────────────────────
const LESSON_TYPES = ["reading", "video", "quiz", "lab"] as const;
const LessonInput = z.object({
  course_id: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  lesson_type: z.enum(LESSON_TYPES).default("reading"),
  video_url: z.string().trim().url().optional().or(z.literal("")),
  content_md: z.string().trim().max(50000).optional().or(z.literal("")),
  duration_min: z.number().int().min(0).optional().nullable(),
  order_no: z.number().int().min(0).default(0),
  preview: z.boolean().default(false),
  resources: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
});

export const listLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { course_id: string }) => z.object({ course_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("lessons")
      .select("*")
      .eq("course_id", data.course_id)
      .order("order_no", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string } & z.infer<typeof LessonInput>) =>
    z.object({ id: z.string().uuid().optional() }).merge(LessonInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      course_id: data.course_id,
      title: data.title,
      lesson_type: data.lesson_type,
      video_url: data.video_url || null,
      content_md: data.content_md || null,
      duration_min: data.duration_min ?? null,
      order_no: data.order_no,
      preview: data.preview,
      resources: data.resources,
    };
    if (data.id) {
      const { error } = await context.supabase.from("lessons").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const, id: data.id };
    } else {
      const { data: row, error } = await context.supabase.from("lessons").insert(payload).select().single();
      if (error) throw new Error(error.message);
      return { ok: true as const, id: row.id as string };
    }
  });

export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("lessons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY / STUDENTS / ROLES
// ─────────────────────────────────────────────────────────────────────────────
const ROLES: AppRole[] = [
  "student",
  "faculty",
  "mentor",
  "counselor",
  "placement_officer",
  "enterprise_client",
  "admin",
  "super_admin",
];

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { role?: AppRole | "all" }) =>
    z
      .object({ role: z.enum(["all", ...ROLES] as unknown as [string, ...string[]]).optional() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: profiles, error: pErr } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, headline")
      .order("created_at", { ascending: false })
      .limit(500);
    if (pErr) throw new Error(pErr.message);
    const ids = (profiles ?? []).map((p: any) => p.id);
    if (ids.length === 0) return [];
    const { data: roleRows, error: rErr } = await context.supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids);
    if (rErr) throw new Error(rErr.message);
    const byUser = new Map<string, AppRole[]>();
    for (const r of roleRows ?? []) {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      byUser.set(r.user_id, arr);
    }
    const enriched = (profiles ?? []).map((p: any) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
    if (data.role && data.role !== "all") {
      return enriched.filter((u) => u.roles.includes(data.role as AppRole));
    }
    return enriched;
  });

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; role: AppRole }) =>
    z.object({ user_id: z.string().uuid(), role: z.enum(ROLES as [AppRole, ...AppRole[]]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("user_roles")
      .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; role: AppRole }) =>
    z.object({ user_id: z.string().uuid(), role: z.enum(ROLES as [AppRole, ...AppRole[]]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// COURSE ↔ FACULTY
// ─────────────────────────────────────────────────────────────────────────────
export const listCourseFaculty = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { course_id: string }) => z.object({ course_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("course_faculty")
      .select("id, faculty_id, created_at")
      .eq("course_id", data.course_id);
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r: any) => r.faculty_id);
    if (ids.length === 0) return [];
    const { data: profiles, error: pErr } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      faculty_id: r.faculty_id,
      profile: profiles?.find((p: any) => p.id === r.faculty_id) ?? null,
    }));
  });

export const assignFaculty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { course_id: string; faculty_id: string }) =>
    z.object({ course_id: z.string().uuid(), faculty_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Confirm target has faculty role
    const { data: hasFaculty, error: rErr } = await context.supabase.rpc("has_role", {
      _user_id: data.faculty_id,
      _role: "faculty",
    });
    if (rErr) throw new Error(rErr.message);
    if (!hasFaculty) throw new Error("Target user does not have the 'faculty' role. Grant the role first.");
    const { error } = await context.supabase
      .from("course_faculty")
      .upsert(
        { course_id: data.course_id, faculty_id: data.faculty_id },
        { onConflict: "course_id,faculty_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const unassignFaculty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("course_faculty").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
const AssignmentInput = z.object({
  course_id: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(10000).optional().or(z.literal("")),
  due_date: z.string().datetime().optional().or(z.literal("")),
  max_score: z.number().int().min(0).max(10000).default(100),
});

export const listAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { course_id?: string }) => z.object({ course_id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("assignments").select("*").order("created_at", { ascending: false });
    if (data.course_id) q = q.eq("course_id", data.course_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string } & z.infer<typeof AssignmentInput>) =>
    z.object({ id: z.string().uuid().optional() }).merge(AssignmentInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      course_id: data.course_id,
      title: data.title,
      description: data.description || null,
      due_date: data.due_date || null,
      max_score: data.max_score,
    };
    if (data.id) {
      const { error } = await context.supabase.from("assignments").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("assignments").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return { ok: true as const, id: row.id as string };
  });

export const deleteAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("assignments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const CertTemplateInput = z.object({
  program_id: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  template_html: z.string().max(50000).default(""),
});

export const listCertificateTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("certificate_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCertificateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string } & z.infer<typeof CertTemplateInput>) =>
    z.object({ id: z.string().uuid().optional() }).merge(CertTemplateInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      program_id: data.program_id,
      name: data.name,
      template_html: data.template_html,
    };
    if (data.id) {
      const { error } = await context.supabase.from("certificate_templates").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("certificate_templates")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, id: row.id as string };
  });

export const deleteCertificateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("certificate_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
