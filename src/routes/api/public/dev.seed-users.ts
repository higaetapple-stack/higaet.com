import { createFileRoute } from "@tanstack/react-router";

// Guarded one-shot test-user seeder.
// Usage: curl -X POST -H "x-seed-token: $DEV_SEED_TOKEN" https://<host>/api/public/dev/seed-users
//
// Creates: admin, faculty, counselor, placement_officer, student1, student2
// All passwords: "Passw0rd!" — for dev/QA only.
// Idempotent: re-running updates roles + enrollments without duplicating users.

type SeedUser = {
  email: string;
  full_name: string;
  role:
    | "admin"
    | "super_admin"
    | "faculty"
    | "mentor"
    | "counselor"
    | "placement_officer"
    | "student";
  enroll_program_slugs?: string[];
};

const SEED_USERS: SeedUser[] = [
  { email: "admin@higaet.test",     full_name: "Test Admin",     role: "admin" },
  { email: "faculty@higaet.test",   full_name: "Test Faculty",   role: "faculty" },
  { email: "counselor@higaet.test", full_name: "Test Counselor", role: "counselor" },
  { email: "placement@higaet.test", full_name: "Test Placement", role: "placement_officer" },
  {
    email: "student1@higaet.test",
    full_name: "Test Student One",
    role: "student",
    enroll_program_slugs: ["gen-ai-engineering", "full-stack-ai"],
  },
  {
    email: "student2@higaet.test",
    full_name: "Test Student Two",
    role: "student",
    enroll_program_slugs: ["ai-product-management"],
  },
];

const TEST_PASSWORD = "Passw0rd!";

export const Route = createFileRoute("/api/public/dev/seed-users")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-seed-token");
        const expected = process.env.DEV_SEED_TOKEN;
        if (!expected || !token || token !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const results: Array<{ email: string; id: string; role: string; enrollments: number }> = [];

        // Resolve published program ids once
        const { data: programs } = await supabaseAdmin
          .from("programs")
          .select("id, slug")
          .eq("status", "published");
        const programBySlug = new Map((programs ?? []).map((p) => [p.slug, p.id as string]));

        for (const u of SEED_USERS) {
          // Find or create the auth user
          let userId: string | null = null;
          const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const existing = list?.users?.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
          if (existing) {
            userId = existing.id;
          } else {
            const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
              email: u.email,
              password: TEST_PASSWORD,
              email_confirm: true,
              user_metadata: { full_name: u.full_name },
            });
            if (cErr || !created.user) {
              return Response.json({ ok: false, step: "createUser", email: u.email, error: cErr?.message }, { status: 500 });
            }
            userId = created.user.id;
          }

          // Ensure profile exists (handle_new_user trigger normally inserts it; upsert as a safety net)
          await supabaseAdmin
            .from("profiles")
            .upsert({ id: userId, email: u.email, full_name: u.full_name }, { onConflict: "id" });

          // Replace role with the seeded one (drop default 'student' for staff)
          await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: u.role });

          // Enrollments for students
          let enrollCount = 0;
          if (u.role === "student" && u.enroll_program_slugs?.length) {
            const rows = u.enroll_program_slugs
              .map((slug) => programBySlug.get(slug))
              .filter((id): id is string => !!id)
              .map((program_id) => ({ student_id: userId!, program_id, status: "active" as const }));
            if (rows.length) {
              const { error: enrErr } = await supabaseAdmin
                .from("enrollments")
                .upsert(rows, { onConflict: "student_id,program_id" });
              if (enrErr) {
                return Response.json({ ok: false, step: "enroll", email: u.email, error: enrErr.message }, { status: 500 });
              }
              enrollCount = rows.length;
            }
          }

          results.push({ email: u.email, id: userId, role: u.role, enrollments: enrollCount });
        }

        return Response.json({
          ok: true,
          password: TEST_PASSWORD,
          note: "Dev/QA only. Sign in at /auth with any seeded email and this password.",
          users: results,
        });
      },
    },
  },
});
