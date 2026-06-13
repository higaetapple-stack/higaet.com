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

// Public: featured + community success stories
export const listSuccessStories = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [featured, community, placements] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, avatar_url, headline, portfolio_slug, success_story_summary, success_story_priority",
      )
      .eq("featured_success_story", true)
      .neq("portfolio_visibility", "private")
      .order("success_story_priority", { ascending: false })
      .limit(12),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url, headline, portfolio_slug, updated_at")
      .eq("portfolio_visibility", "public")
      .eq("featured_success_story", false)
      .order("updated_at", { ascending: false })
      .limit(24),
    supabaseAdmin
      .from("placements")
      .select(
        "id, job_title, salary_package, salary_currency, employment_type, offer_date, employers(name, logo_url), profiles:student_id(full_name, avatar_url, portfolio_slug, portfolio_visibility), programs(title)",
      )
      .eq("verified", true)
      .order("offer_date", { ascending: false, nullsFirst: false })
      .limit(12),
  ]);

  // Enrich each featured profile with cert count
  const ids = (featured.data ?? []).map((p: any) => p.id);
  let certCounts: Record<string, number> = {};
  if (ids.length) {
    const { data: rows } = await supabaseAdmin
      .from("certificates")
      .select("student_id")
      .in("student_id", ids)
      .eq("revoked", false);
    for (const r of (rows ?? []) as any[]) {
      certCounts[r.student_id] = (certCounts[r.student_id] ?? 0) + 1;
    }
  }

  return {
    featured: (featured.data ?? []).map((p: any) => ({
      ...p,
      certificates_count: certCounts[p.id] ?? 0,
    })),
    community: community.data ?? [],
    placements: (placements.data ?? []).map((p: any) => ({
      ...p,
      // strip profile slug if portfolio is private
      profiles: p.profiles
        ? {
            ...p.profiles,
            portfolio_slug:
              p.profiles.portfolio_visibility === "private" ? null : p.profiles.portfolio_slug,
          }
        : null,
    })),
  };
});

// Admin: list candidates for featuring
export const adminListStoryCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("profiles")
      .select(
        "id, full_name, email, headline, portfolio_slug, portfolio_visibility, featured_success_story, success_story_summary, success_story_priority, updated_at",
      )
      .order("featured_success_story", { ascending: false })
      .order("success_story_priority", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const StoryInput = z.object({
  id: z.string().uuid(),
  featured_success_story: z.boolean(),
  success_story_summary: z.string().max(1000).nullable().optional(),
  success_story_priority: z.number().int().min(0).max(1000).default(0),
});

export const adminUpsertStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => StoryInput.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({
        featured_success_story: data.featured_success_story,
        success_story_summary: data.success_story_summary ?? null,
        success_story_priority: data.success_story_priority,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
