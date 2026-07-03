// Release Intelligence server functions.
// Client-safe imports; handler bodies stripped from client bundle.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildReleaseReport } from "./releases/report";
import type { ReleaseReport } from "./releases/types";

const input = z.object({
  releaseId: z.string().trim().min(1).max(120).default("latest"),
});

// Uses the authenticated Supabase client from requireSupabaseAuth context.
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (isAdmin) return;
  const { data: isSuper } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin",
  });
  if (!isSuper) throw new Error("Forbidden");
}

export const adminReleaseReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<ReleaseReport> => {
    await assertAdmin(context);
    return buildReleaseReport(data.releaseId);
  });
