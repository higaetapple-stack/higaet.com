/**
 * Admin-gated incident replay: takes a Sentry issue id, returns a stepwise
 * reconstruction of the AI SRE reasoning as events arrived. Read-only.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runIncidentReplay } from "@/lib/replay/replay-engine";
import type { IncidentReplay } from "@/lib/replay/types";
import { SentryClient } from "@/lib/sre/ai/sentry-client";

async function assertAdmin(ctx: {
  supabase: {
    rpc: (
      name: "has_role",
      args: { _user_id: string; _role: "admin" | "super_admin" },
    ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  };
  userId: string;
}) {
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

export interface AdminReplayResult {
  configured: boolean;
  replay: IncidentReplay;
}

export const adminReplayIncident = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { issueId: string }) => {
    if (!input?.issueId || typeof input.issueId !== "string") {
      throw new Error("issueId is required");
    }
    // Sentry issue ids are numeric strings; allow shortIds too (ALNUM-###).
    if (!/^[A-Za-z0-9-]+$/.test(input.issueId)) {
      throw new Error("Invalid issueId");
    }
    return { issueId: input.issueId };
  })
  .handler(async ({ data, context }): Promise<AdminReplayResult> => {
    await assertAdmin(context as never);
    const client = new SentryClient();
    if (!client.isConfigured()) {
      return {
        configured: false,
        replay: {
          issueId: data.issueId,
          title: "Sentry not configured",
          timeline: [],
          steps: [],
          summary: {
            durationMs: 0,
            totalEvents: 0,
            peakErrorRate: 0,
            finalConfidence: 0,
            finalCategory: "unknown",
            systemic: false,
          },
        },
      };
    }
    const replay = await runIncidentReplay(data.issueId, { client, eventLimit: 25 });
    return { configured: true, replay };
  });
