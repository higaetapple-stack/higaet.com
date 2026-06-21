import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

async function assertFacultyOrAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin", "faculty"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const SUBMISSION_STATUSES = ["pending", "reviewed", "passed", "failed", "needs_revision"] as const;
const SUBMISSION_TYPES = ["file", "github", "portfolio", "text", "mixed"] as const;
const PROJECT_STATUSES = ["draft", "submitted", "reviewed", "passed", "failed", "needs_revision"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function makeCertNumber() {
  const year = new Date().getFullYear();
  const tail = randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
  return `HIGAET-${year}-${tail}`;
}

async function tryIssueCertificate(
  sb: any,
  studentId: string,
  programId: string,
  issuerId: string | null,
) {
  const { data: existing } = await sb
    .from("certificates")
    .select("id")
    .eq("student_id", studentId)
    .eq("program_id", programId)
    .maybeSingle();
  if (existing) return { issued: false, reason: "exists" as const };

  const { data: eligible, error: eErr } = await sb.rpc("is_program_eligible", {
    _student: studentId,
    _program: programId,
  });
  if (eErr) throw new Error(eErr.message);
  if (!eligible) return { issued: false, reason: "not_eligible" as const };

  const number = makeCertNumber();
  const issued_at = new Date().toISOString();
  const hash = createHash("sha256")
    .update(`${number}|${studentId}|${programId}|${issued_at}`)
    .digest("hex");

  const { data: row, error } = await sb
    .from("certificates")
    .insert({
      student_id: studentId,
      program_id: programId,
      certificate_number: number,
      verification_hash: hash,
      issued_by: issuerId,
      issued_at,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Best-effort PDF/QR generation; never block issuance on it
  try {
    const mod = await import("@/lib/certificates.functions");
    await mod.generateCertificateArtifactsServer(row.id, issuerId);
  } catch (e) {
    console.error("certificate artifact generation failed", e);
  }

  return { issued: true as const, id: row.id, number };
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT: ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const listMyAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: enrolls, error: eErr } = await sb
      .from("enrollments")
      .select("program_id")
      .eq("student_id", context.userId);
    if (eErr) throw new Error(eErr.message);
    const programIds = (enrolls ?? []).map((r: any) => r.program_id);
    if (programIds.length === 0) return [];

    const { data: courses } = await sb
      .from("courses")
      .select("id, title, program_id, programs(title, slug)")
      .in("program_id", programIds);
    const courseIds = (courses ?? []).map((c: any) => c.id);
    if (courseIds.length === 0) return [];

    const { data: assignments, error: aErr } = await sb
      .from("assignments")
      .select("*")
      .in("course_id", courseIds)
      .order("due_date", { ascending: true, nullsFirst: false });
    if (aErr) throw new Error(aErr.message);

    const aIds = (assignments ?? []).map((a: any) => a.id);
    const { data: subs } = aIds.length
      ? await sb
          .from("submissions")
          .select("id, assignment_id, status, score, submitted_at, graded_at")
          .eq("student_id", context.userId)
          .in("assignment_id", aIds)
      : { data: [] as any[] };
    const subByA = new Map((subs ?? []).map((s: any) => [s.assignment_id, s]));
    const courseById = new Map((courses ?? []).map((c: any) => [c.id, c]));

    return (assignments ?? []).map((a: any) => ({
      ...a,
      course: courseById.get(a.course_id) ?? null,
      submission: subByA.get(a.id) ?? null,
    }));
  });

export const getAssignment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: a, error } = await sb
      .from("assignments")
      .select("*, courses(id, title, program_id, programs(id, title, slug))")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!a) throw new Error("Assignment not found");

    const { data: sub } = await sb
      .from("submissions")
      .select("*")
      .eq("assignment_id", data.id)
      .eq("student_id", context.userId)
      .maybeSingle();

    return { assignment: a, submission: sub };
  });

const SubmitInput = z.object({
  assignment_id: z.string().uuid(),
  submission_type: z.enum(SUBMISSION_TYPES),
  content: z.string().trim().max(20000).optional().or(z.literal("")),
  file_url: z.string().trim().url().max(2000).optional().or(z.literal("")),
  external_url: z.string().trim().url().max(2000).optional().or(z.literal("")),
});

export const submitAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof SubmitInput>) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const payload = {
      assignment_id: data.assignment_id,
      student_id: context.userId,
      submission_type: data.submission_type,
      content: data.content || null,
      file_url: data.file_url || null,
      external_url: data.external_url || null,
      status: "pending" as const,
      submitted_at: new Date().toISOString(),
    };
    const { error } = await sb
      .from("submissions")
      .upsert(payload, { onConflict: "assignment_id,student_id" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// FACULTY: GRADING
// ─────────────────────────────────────────────────────────────────────────────
export const listSubmissionsToGrade = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string }) =>
    z.object({ status: z.enum([...SUBMISSION_STATUSES, "all"] as [string, ...string[]]).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    let q = sb
      .from("submissions")
      .select(
        "id, assignment_id, student_id, submission_type, content, file_url, external_url, status, score, feedback, submitted_at, graded_at, assignments(id, title, max_score, course_id, courses(id, title, program_id)), profiles!submissions_student_id_fkey(id, full_name, email)",
      )
      .order("submitted_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const GradeInput = z.object({
  submission_id: z.string().uuid(),
  status: z.enum(SUBMISSION_STATUSES),
  score: z.number().int().min(0).max(100).nullable(),
  feedback: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const gradeSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof GradeInput>) => GradeInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertFacultyOrAdmin(context);
    const sb = context.supabase;
    const { data: sub, error: gErr } = await sb
      .from("submissions")
      .update({
        status: data.status,
        score: data.score,
        feedback: data.feedback || null,
        graded_by: context.userId,
        graded_at: new Date().toISOString(),
      })
      .eq("id", data.submission_id)
      .select("student_id, assignments(course_id, courses(program_id))")
      .single();
    if (gErr) throw new Error(gErr.message);

    if (data.status === "passed") {
      const programId = (sub as any)?.assignments?.courses?.program_id;
      if (programId) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await tryIssueCertificate(supabaseAdmin, (sub as any).student_id, programId, context.userId);
      }
    }
    return { ok: true as const };
  });

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT: CERTIFICATES + ACHIEVEMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const listMyCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data, error } = await sb
      .from("certificates")
      .select("*, programs(id, title, slug, category)")
      .eq("student_id", context.userId)
      .order("issued_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyCertificate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: cert, error } = await sb
      .from("certificates")
      .select("*, programs(id, title, slug, category, duration), profiles!certificates_student_id_fkey(id, full_name, email)")
      .eq("id", data.id)
      .eq("student_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cert) throw new Error("Certificate not found");
    return cert;
  });

export const getMyAchievementStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [certs, subs, projects] = await Promise.all([
      sb.from("certificates").select("id", { count: "exact", head: true }).eq("student_id", context.userId),
      sb
        .from("submissions")
        .select("id, score, status", { count: "exact" })
        .eq("student_id", context.userId),
      sb
        .from("project_submissions")
        .select("id, status", { count: "exact" })
        .eq("student_id", context.userId),
    ]);
    const subRows = (subs.data ?? []) as any[];
    const passed = subRows.filter((s) => s.status === "passed");
    const avg = passed.length
      ? Math.round(passed.reduce((a, s) => a + (s.score ?? 0), 0) / passed.length)
      : null;
    return {
      certificates_earned: certs.count ?? 0,
      assignments_completed: subRows.filter((s) => s.status === "passed").length,
      projects_completed: ((projects.data ?? []) as any[]).filter((p) => p.status === "passed").length,
      average_score: avg,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: VERIFY CERTIFICATE (no auth)
// ─────────────────────────────────────────────────────────────────────────────
export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((d: { number: string }) =>
    z.object({ number: z.string().trim().min(4).max(64) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("verify_certificate", {
      _number: data.number,
    });
    if (error) throw new Error(error.message);
    const r = (rows ?? [])[0];
    if (!r) return { valid: false as const };
    return { valid: true as const, ...r };
  });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: CERTIFICATE ISSUANCE / REVOCATION + ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export const adminIssueCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { student_id: string; program_id: string; force?: boolean }) =>
    z.object({
      student_id: z.string().uuid(),
      program_id: z.string().uuid(),
      force: z.boolean().optional().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.force) {
      const number = makeCertNumber();
      const issued_at = new Date().toISOString();
      const hash = createHash("sha256")
        .update(`${number}|${data.student_id}|${data.program_id}|${issued_at}`)
        .digest("hex");
      const { error } = await supabaseAdmin.from("certificates").insert({
        student_id: data.student_id,
        program_id: data.program_id,
        certificate_number: number,
        verification_hash: hash,
        issued_by: context.userId,
        issued_at,
      });
      if (error) throw new Error(error.message);
      return { ok: true as const, number };
    }
    const res = await tryIssueCertificate(supabaseAdmin, data.student_id, data.program_id, context.userId);
    if (!res.issued) {
      if (res.reason === "exists") throw new Error("Certificate already issued for this student/program.");
      throw new Error("Student is not eligible (incomplete lessons or unpassed required assignments).");
    }
    return { ok: true as const, number: res.number };
  });

export const adminRevokeCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason?: string }) =>
    z.object({ id: z.string().uuid(), reason: z.string().trim().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("certificates")
      .update({ revoked: true, revoked_at: new Date().toISOString(), revoked_reason: data.reason || null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminListCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("certificates")
      .select("*, programs(title, slug), profiles!certificates_student_id_fkey(id, full_name, email)")
      .order("issued_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [
      enr, certs, subs, recentProg,
      students, lessonsDone, projSubs,
      portfolios, employers, jobs, jobApps, placements,
    ] = await Promise.all([
      sb.from("enrollments").select("id, status", { count: "exact" }),
      sb.from("certificates").select("id", { count: "exact", head: true }).eq("revoked", false),
      sb.from("submissions").select("id, status", { count: "exact" }),
      sb.from("progress").select("student_id", { count: "exact" }).eq("completed", true).gte("updated_at", since),
      sb.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
      sb.from("progress").select("id", { count: "exact", head: true }).eq("completed", true),
      sb.from("project_submissions").select("id", { count: "exact", head: true }),
      sb.from("profiles").select("id", { count: "exact", head: true }).eq("portfolio_visibility", "public"),
      sb.from("employers").select("id", { count: "exact", head: true }),
      sb.from("job_postings").select("id, status", { count: "exact" }),
      sb.from("job_applications").select("id", { count: "exact", head: true }),
      sb.from("placements").select("id, verified", { count: "exact" }),
    ]);
    const enrRows = (enr.data ?? []) as any[];
    const subRows = (subs.data ?? []) as any[];
    const jobRows = (jobs.data ?? []) as any[];
    const placeRows = (placements.data ?? []) as any[];
    const active = new Set(((recentProg.data ?? []) as any[]).map((r) => r.student_id)).size;
    const completed = enrRows.filter((r) => r.status === "completed").length;
    const total = enrRows.length;
    const jobsOpen = jobRows.filter((j) => j.status === "open").length;
    const apps = jobApps.count ?? 0;
    return {
      // Academy
      enrollments_total: total,
      enrollments_active: enrRows.filter((r) => r.status === "active").length,
      enrollments_completed: completed,
      active_students_30d: active,
      submissions_total: subs.count ?? 0,
      submissions_passed: subRows.filter((s) => s.status === "passed").length,
      submissions_pending: subRows.filter((s) => s.status === "pending").length,
      certificates_issued: certs.count ?? 0,
      completion_rate: total ? Math.round((completed / total) * 100) : 0,
      // Engagement
      students_total: students.count ?? 0,
      lessons_completed_total: lessonsDone.count ?? 0,
      project_submissions_total: projSubs.count ?? 0,
      // Career
      public_portfolios: portfolios.count ?? 0,
      employers_total: employers.count ?? 0,
      jobs_total: jobs.count ?? 0,
      jobs_open: jobsOpen,
      applications_total: apps,
      applications_per_job: jobsOpen ? Math.round((apps / jobsOpen) * 10) / 10 : 0,
      // Placements
      placements_total: placements.count ?? 0,
      placements_verified: placeRows.filter((p) => p.verified).length,
    };
  });


// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS (capstone)
// ─────────────────────────────────────────────────────────────────────────────
const ProjectInput = z.object({
  program_id: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  brief: z.string().trim().max(4000).optional().or(z.literal("")),
  guidelines: z.string().trim().max(20000).optional().or(z.literal("")),
  due_at: z.string().datetime().optional().nullable(),
  is_required: z.boolean().default(false),
});

export const listMyProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: enrolls } = await sb
      .from("enrollments")
      .select("program_id")
      .eq("student_id", context.userId);
    const programIds = (enrolls ?? []).map((r: any) => r.program_id);
    if (programIds.length === 0) return [];
    const { data: projects, error } = await sb
      .from("projects")
      .select("*, programs(title, slug)")
      .in("program_id", programIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const pIds = (projects ?? []).map((p: any) => p.id);
    const { data: subs } = pIds.length
      ? await sb
          .from("project_submissions")
          .select("id, project_id, status, score, submitted_at")
          .eq("student_id", context.userId)
          .in("project_id", pIds)
      : { data: [] as any[] };
    const subBy = new Map((subs ?? []).map((s: any) => [s.project_id, s]));
    return (projects ?? []).map((p: any) => ({ ...p, submission: subBy.get(p.id) ?? null }));
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: project, error } = await sb
      .from("projects")
      .select("*, programs(id, title, slug)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");
    const { data: submission } = await sb
      .from("project_submissions")
      .select("*")
      .eq("project_id", data.id)
      .eq("student_id", context.userId)
      .maybeSingle();
    return { project, submission };
  });

const ProjectSubmitInput = z.object({
  project_id: z.string().uuid(),
  repo_url: z.string().trim().url().max(2000).optional().or(z.literal("")),
  demo_url: z.string().trim().url().max(2000).optional().or(z.literal("")),
  summary: z.string().trim().max(10000).optional().or(z.literal("")),
});

export const submitProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ProjectSubmitInput>) => ProjectSubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { error } = await sb.from("project_submissions").upsert(
      {
        project_id: data.project_id,
        student_id: context.userId,
        repo_url: data.repo_url || null,
        demo_url: data.demo_url || null,
        summary: data.summary || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "project_id,student_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// Admin CRUD on projects
export const adminListProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("projects")
      .select("*, programs(title, slug)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string } & z.infer<typeof ProjectInput>) =>
    z.object({ id: z.string().uuid().optional() }).merge(ProjectInput).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      program_id: data.program_id,
      title: data.title,
      brief: data.brief || null,
      guidelines: data.guidelines || null,
      due_at: data.due_at || null,
      is_required: data.is_required,
    };
    if (data.id) {
      const { error } = await context.supabase.from("projects").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("projects").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const adminDeleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// Faculty: review project submissions
export const listProjectSubmissionsToReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data, error } = await sb
      .from("project_submissions")
      .select(
        "*, projects(id, title, program_id, programs(title, slug)), profiles!project_submissions_student_id_fkey(id, full_name, email)",
      )
      .order("submitted_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const gradeProjectSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string; score: number | null; feedback?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(PROJECT_STATUSES),
        score: z.number().int().min(0).max(100).nullable(),
        feedback: z.string().trim().max(5000).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFacultyOrAdmin(context);
    const sb = context.supabase;
    const { error } = await sb
      .from("project_submissions")
      .update({
        status: data.status,
        score: data.score,
        feedback: data.feedback || null,
        graded_by: context.userId,
        graded_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// Used by learn.functions to auto-issue cert after last lesson
export const tryAutoIssueAfterLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { program_id: string }) =>
    z.object({ program_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = await tryIssueCertificate(supabaseAdmin, context.userId, data.program_id, null);
    return res;
  });
