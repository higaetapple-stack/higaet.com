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

const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship"] as const;
const PLACEMENT_STATUSES = ["offered", "accepted", "joined", "declined", "withdrawn"] as const;

const PlacementInput = z.object({
  id: z.string().uuid().optional(),
  student_id: z.string().uuid(),
  employer_id: z.string().uuid().nullable().optional(),
  job_posting_id: z.string().uuid().nullable().optional(),
  program_id: z.string().uuid().nullable().optional(),
  job_title: z.string().trim().min(2).max(200),
  salary_package: z.number().nonnegative().nullable().optional(),
  salary_currency: z.string().trim().min(1).max(8).default("INR"),
  employment_type: z.enum(EMPLOYMENT_TYPES).default("full_time"),
  offer_date: z.string().nullable().optional(),
  joining_date: z.string().nullable().optional(),
  status: z.enum(PLACEMENT_STATUSES).default("offered"),
  verified: z.boolean().default(false),
  notes: z.string().max(2000).nullable().optional(),
});

export const adminListPlacements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("placements")
      .select(
        "*, profiles:student_id(full_name,email), employers(name,slug), programs(title), job_postings(title,slug)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertPlacement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PlacementInput.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const row = { ...data, created_by: context.userId };
    const q = data.id
      ? context.supabase.from("placements").update(row).eq("id", data.id).select("id").single()
      : context.supabase.from("placements").insert(row).select("id").single();
    const { data: out, error } = await q;
    if (error) throw new Error(error.message);
    return out;
  });

export const adminDeletePlacement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("placements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin: search students for the placement form
export const adminSearchStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ q: z.string().trim().max(120).default("") }).parse(i ?? {}))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let q = context.supabase.from("profiles").select("id, full_name, email").limit(20);
    if (data.q) {
      const safe = data.q.replace(/[,.()%*\\]/g, " ").trim();
      if (safe) q = q.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
