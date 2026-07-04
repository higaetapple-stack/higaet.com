/**
 * Admin server fns for the AI SRE PR + webhook queue surfaces.
 *
 * Reuses the same governance admin gate as sre.functions.ts. Kept in a
 * separate module so the existing sre.functions.ts stays stable.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ListPRInput = z.object({
  state: z.enum(["pending", "open", "closed", "merged", "failed"]).optional(),
  reviewOnly: z.boolean().optional(),
  cursor: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export const listSentryPullRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListPRInput>) => ListPRInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin, decodeCursor, paginateList } = await import(
      "@/lib/governance/rbac.server"
    );
    await assertGovernanceAdmin(context);
    let q = (context.supabase as any)
      .from("sentry_pull_requests")
      .select("*", data.cursor ? undefined : { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.state) q = q.eq("pr_state", data.state);
    if (data.reviewOnly) q = q.eq("requires_human_review", true);
    return paginateList(q, { cursor: decodeCursor(data.cursor), limit: data.limit });
  });

const ListDLQInput = z.object({
  includeAll: z.boolean().optional(),
  cursor: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export const listWebhookDeadLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListDLQInput>) => ListDLQInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin, decodeCursor, paginateList } = await import(
      "@/lib/governance/rbac.server"
    );
    await assertGovernanceAdmin(context);
    let q = (context.supabase as any)
      .from("sentry_webhook_queue")
      .select("*", data.cursor ? undefined : { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (!data.includeAll) {
      q = q.in("status", ["failed", "failed_permanent"]);
    }
    return paginateList(q, { cursor: decodeCursor(data.cursor), limit: data.limit });
  });

const RetryDLQInput = z.object({ id: z.string().uuid() });

export const retryDeadLetterEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof RetryDLQInput>) => RetryDLQInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    await assertGovernanceAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("sentry_webhook_queue" as never)
      .update({
        status: "pending",
        attempt_count: 0,
        next_retry_at: null,
        locked_at: null,
        locked_by: null,
        last_error: null,
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    // Best-effort kick.
    const { processSentryWebhookQueue } = await import("@/lib/webhooks/queue.server");
    void processSentryWebhookQueue({ batchSize: 3 }).catch(() => undefined);
    return { ok: true };
  });
