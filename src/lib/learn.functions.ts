import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ── Student: my programs (with progress %) ───────────────────────────────────
export const getMyPrograms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: enrolls, error: eErr } = await sb
      .from("enrollments")
      .select("id, program_id, status, enrolled_at, programs(id, slug, title, category, thumbnail_url, status, description)")
      .eq("student_id", context.userId)
      .order("enrolled_at", { ascending: false });
    if (eErr) throw new Error(eErr.message);
    const rows = enrolls ?? [];
    if (rows.length === 0) return [];
    const programIds = rows.map((r: any) => r.program_id);

    const { data: courses, error: cErr } = await sb
      .from("courses")
      .select("id, program_id")
      .in("program_id", programIds);
    if (cErr) throw new Error(cErr.message);
    const courseIds = (courses ?? []).map((c: any) => c.id);
    const coursesByProgram = new Map<string, string[]>();
    for (const c of courses ?? []) {
      const arr = coursesByProgram.get(c.program_id) ?? [];
      arr.push(c.id);
      coursesByProgram.set(c.program_id, arr);
    }

    const { data: lessons, error: lErr } = courseIds.length
      ? await sb.from("lessons").select("id, course_id").in("course_id", courseIds)
      : { data: [] as any[], error: null };
    if (lErr) throw new Error(lErr.message);
    const lessonsByCourse = new Map<string, string[]>();
    const lessonCourse = new Map<string, string>();
    for (const l of lessons ?? []) {
      const arr = lessonsByCourse.get(l.course_id) ?? [];
      arr.push(l.id);
      lessonsByCourse.set(l.course_id, arr);
      lessonCourse.set(l.id, l.course_id);
    }

    const allLessonIds = (lessons ?? []).map((l: any) => l.id);
    const { data: completed, error: pErr } = allLessonIds.length
      ? await sb
          .from("progress")
          .select("lesson_id")
          .eq("student_id", context.userId)
          .eq("completed", true)
          .in("lesson_id", allLessonIds)
      : { data: [] as any[], error: null };
    if (pErr) throw new Error(pErr.message);
    const completedSet = new Set((completed ?? []).map((c: any) => c.lesson_id));

    return rows.map((r: any) => {
      const cIds = coursesByProgram.get(r.program_id) ?? [];
      const lIds = cIds.flatMap((cid) => lessonsByCourse.get(cid) ?? []);
      const done = lIds.filter((id) => completedSet.has(id)).length;
      const total = lIds.length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      return {
        enrollment_id: r.id,
        status: r.status,
        enrolled_at: r.enrolled_at,
        program: r.programs,
        progress: { done, total, pct },
      };
    });
  });

// ── Program detail (curriculum + faculty + my progress) ──────────────────────
export const getProgramDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: program, error: pErr } = await sb
      .from("programs")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!program) throw new Error("Program not found");

    const { data: enrollment } = await sb
      .from("enrollments")
      .select("id, status, enrolled_at")
      .eq("student_id", context.userId)
      .eq("program_id", program.id)
      .maybeSingle();

    const { data: courses, error: cErr } = await sb
      .from("courses")
      .select("id, slug, title, description, order_no, status")
      .eq("program_id", program.id)
      .order("order_no", { ascending: true });
    if (cErr) throw new Error(cErr.message);

    const courseIds = (courses ?? []).map((c: any) => c.id);
    const { data: lessons } = courseIds.length
      ? await sb
          .from("lessons")
          .select("id, course_id, title, lesson_type, duration_min, order_no, preview")
          .in("course_id", courseIds)
          .order("order_no", { ascending: true })
      : { data: [] as any[] };

    const { data: cf } = courseIds.length
      ? await sb.from("course_faculty").select("course_id, faculty_id").in("course_id", courseIds)
      : { data: [] as any[] };
    const facultyIds = Array.from(new Set((cf ?? []).map((r: any) => r.faculty_id)));
    const { data: profiles } = facultyIds.length
      ? await sb.from("profiles").select("id, full_name, avatar_url, headline").in("id", facultyIds)
      : { data: [] as any[] };

    const allLessonIds = (lessons ?? []).map((l: any) => l.id);
    const { data: completed } = allLessonIds.length
      ? await sb
          .from("progress")
          .select("lesson_id, completed_at")
          .eq("student_id", context.userId)
          .eq("completed", true)
          .in("lesson_id", allLessonIds)
      : { data: [] as any[] };
    const completedSet = new Set((completed ?? []).map((c: any) => c.lesson_id));

    const facultyByCourse = new Map<string, any[]>();
    for (const r of cf ?? []) {
      const arr = facultyByCourse.get(r.course_id) ?? [];
      const prof = profiles?.find((p: any) => p.id === r.faculty_id);
      if (prof) arr.push(prof);
      facultyByCourse.set(r.course_id, arr);
    }

    const curriculum = (courses ?? []).map((c: any) => ({
      ...c,
      faculty: facultyByCourse.get(c.id) ?? [],
      lessons: (lessons ?? [])
        .filter((l: any) => l.course_id === c.id)
        .map((l: any) => ({ ...l, completed: completedSet.has(l.id) })),
    }));

    const total = allLessonIds.length;
    const done = allLessonIds.filter((id) => completedSet.has(id)).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    // next incomplete lesson (first by course order_no, lesson order_no)
    let nextLessonId: string | null = null;
    outer: for (const c of curriculum) {
      for (const l of c.lessons) {
        if (!l.completed) {
          nextLessonId = l.id;
          break outer;
        }
      }
    }

    return {
      program,
      enrollment,
      curriculum,
      progress: { done, total, pct },
      certificate_eligible: total > 0 && done === total,
      next_lesson_id: nextLessonId,
    };
  });

// ── Course detail ────────────────────────────────────────────────────────────
export const getCourseDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: course, error } = await sb
      .from("courses")
      .select("*, programs(id, slug, title)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!course) throw new Error("Course not found");

    const { data: lessons } = await sb
      .from("lessons")
      .select("id, title, lesson_type, duration_min, order_no, preview")
      .eq("course_id", data.id)
      .order("order_no", { ascending: true });

    const ids = (lessons ?? []).map((l: any) => l.id);
    const { data: completed } = ids.length
      ? await sb
          .from("progress")
          .select("lesson_id")
          .eq("student_id", context.userId)
          .eq("completed", true)
          .in("lesson_id", ids)
      : { data: [] as any[] };
    const set = new Set((completed ?? []).map((c: any) => c.lesson_id));

    const { data: cf } = await sb.from("course_faculty").select("faculty_id").eq("course_id", data.id);
    const fIds = (cf ?? []).map((r: any) => r.faculty_id);
    const { data: faculty } = fIds.length
      ? await sb.from("profiles").select("id, full_name, avatar_url, headline").in("id", fIds)
      : { data: [] as any[] };

    const done = ids.filter((id) => set.has(id)).length;
    const total = ids.length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    return {
      course,
      lessons: (lessons ?? []).map((l: any) => ({ ...l, completed: set.has(l.id) })),
      faculty: faculty ?? [],
      progress: { done, total, pct },
    };
  });

// ── Lesson player (full content + nav) ───────────────────────────────────────
export const getLesson = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: lesson, error } = await sb
      .from("lessons")
      .select("*, courses(id, slug, title, program_id, programs(id, slug, title))")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!lesson) throw new Error("Lesson not found");

    const { data: siblings } = await sb
      .from("lessons")
      .select("id, order_no, title")
      .eq("course_id", lesson.course_id)
      .order("order_no", { ascending: true });

    const idx = (siblings ?? []).findIndex((l: any) => l.id === lesson.id);
    const prev = idx > 0 ? siblings![idx - 1] : null;
    const next = idx >= 0 && idx < (siblings?.length ?? 0) - 1 ? siblings![idx + 1] : null;

    const { data: prog } = await sb
      .from("progress")
      .select("completed, completed_at")
      .eq("student_id", context.userId)
      .eq("lesson_id", lesson.id)
      .maybeSingle();

    return { lesson, prev, next, completed: !!prog?.completed };
  });

export const markLessonComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lessonId: string }) => z.object({ lessonId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { error } = await sb
      .from("progress")
      .upsert(
        { student_id: context.userId, lesson_id: data.lessonId, completed: true, completed_at: new Date().toISOString() },
        { onConflict: "student_id,lesson_id" },
      );
    if (error) throw new Error(error.message);

    // Try auto-issuing a certificate when the program is now complete
    try {
      const { data: lesson } = await sb
        .from("lessons")
        .select("courses(program_id)")
        .eq("id", data.lessonId)
        .maybeSingle();
      const programId = (lesson as any)?.courses?.program_id;
      if (programId) {
        const { data: eligible } = await sb.rpc("is_program_eligible", {
          _student: context.userId,
          _program: programId,
        });
        if (eligible) {
          const { data: existing } = await sb
            .from("certificates")
            .select("id")
            .eq("student_id", context.userId)
            .eq("program_id", programId)
            .maybeSingle();
          if (!existing) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { createHash, randomBytes } = await import("crypto");
            const year = new Date().getFullYear();
            const number = `HIGAET-${year}-${randomBytes(4).toString("hex").toUpperCase().slice(0, 8)}`;
            const issued_at = new Date().toISOString();
            const hash = createHash("sha256")
              .update(`${number}|${context.userId}|${programId}|${issued_at}`)
              .digest("hex");
            await supabaseAdmin.from("certificates").insert({
              student_id: context.userId,
              program_id: programId,
              certificate_number: number,
              verification_hash: hash,
              issued_at,
            });
          }
        }
      }
    } catch {
      // Non-fatal: lesson completion still succeeded
    }

    return { ok: true as const };
  });

// ── Dashboard summary ────────────────────────────────────────────────────────
export const getDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: enrolls } = await sb
      .from("enrollments")
      .select("program_id, status, programs(id, slug, title, thumbnail_url)")
      .eq("student_id", context.userId);
    const enrolled = enrolls ?? [];

    const { data: completedRows } = await sb
      .from("progress")
      .select("lesson_id, completed_at, lessons(id, title, course_id, courses(id, title, program_id))")
      .eq("student_id", context.userId)
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(5);

    const { count: completedCount } = await sb
      .from("progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", context.userId)
      .eq("completed", true);

    const { count: certsCount } = await sb
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("student_id", context.userId);

    // Continue learning = the most recently active program (or first enrolled)
    let continueProgramSlug: string | null = null;
    if (completedRows && completedRows.length > 0) {
      const recent: any = completedRows[0];
      continueProgramSlug = recent?.lessons?.courses?.program_id
        ? enrolled.find((e: any) => e.program_id === recent.lessons.courses.program_id)?.programs?.slug ?? null
        : null;
    }
    if (!continueProgramSlug && enrolled[0]) {
      continueProgramSlug = (enrolled[0] as any).programs?.slug ?? null;
    }

    return {
      stats: {
        programs_enrolled: enrolled.length,
        lessons_completed: completedCount ?? 0,
        certificates_earned: certsCount ?? 0,
        assignments_pending: 0, // 2C
      },
      recent_activity: (completedRows ?? []).map((r: any) => ({
        lesson_title: r.lessons?.title,
        course_title: r.lessons?.courses?.title,
        completed_at: r.completed_at,
      })),
      continue_program_slug: continueProgramSlug,
      enrolled_programs: enrolled.map((e: any) => e.programs).filter(Boolean),
    };
  });

// ── Admin enrollment ─────────────────────────────────────────────────────────
export const adminListEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { program_id?: string }) =>
    z.object({ program_id: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("enrollments")
      .select("id, status, enrolled_at, programs(id, title, slug), profiles!enrollments_student_id_fkey(id, full_name, email)")
      .order("enrolled_at", { ascending: false })
      .limit(500);
    if (data.program_id) q = q.eq("program_id", data.program_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminEnrollStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; program_id: string }) =>
    z.object({ user_id: z.string().uuid(), program_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("enrollments")
      .upsert(
        { student_id: data.user_id, program_id: data.program_id, status: "active" },
        { onConflict: "student_id,program_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminUnenroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("enrollments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
