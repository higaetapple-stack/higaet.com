/**
 * Sentry webhook reliability queue — server-only.
 *
 * enqueueSentryWebhook: idempotent insert (dedupe by hash of raw body).
 * processSentryWebhookQueue: batch worker with row-level lock, exponential
 * backoff, and dead-letter after MAX_ATTEMPTS.
 *
 * The webhook handler MUST enqueue only. All AI SRE work happens here so
 * Sentry receives a fast 200 and no event is lost on crash / cold start.
 */
import { createHash } from "crypto";
import { processSentryIssue } from "@/lib/sre/pipeline/process-issue.server";

const MAX_ATTEMPTS = 5;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min stale-lock reclaim

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function backoffMs(attempt: number): number {
  // 2^attempt minutes, capped at 60 min
  return Math.min(60, Math.pow(2, attempt)) * 60 * 1000;
}

export interface EnqueueInput {
  rawBody: string;
  eventType: string;
  issueId: string | null;
  parsed: unknown;
}

export interface EnqueueResult {
  queued: boolean;
  duplicate: boolean;
  id?: string;
}

export async function enqueueSentryWebhook(input: EnqueueInput): Promise<EnqueueResult> {
  const supa = await admin();
  const dedupeKey = createHash("sha256")
    .update(`${input.eventType}:${input.issueId ?? ""}:${input.rawBody}`)
    .digest("hex");

  const { data, error } = await supa
    .from("sentry_webhook_queue" as never)
    .insert(
      {
        source: "sentry",
        event_type: input.eventType,
        dedupe_key: dedupeKey,
        issue_id: input.issueId,
        payload: input.parsed as never,
        status: "pending",
      } as never,
    )
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation → duplicate delivery, treat as success
    if ((error as { code?: string }).code === "23505") {
      return { queued: false, duplicate: true };
    }
    throw new Error(`enqueue failed: ${error.message}`);
  }
  return { queued: true, duplicate: false, id: (data as { id: string }).id };
}

export interface ProcessQueueResult {
  claimed: number;
  completed: number;
  retried: number;
  deadLettered: number;
}

export async function processSentryWebhookQueue(
  opts: { batchSize?: number; workerId?: string } = {},
): Promise<ProcessQueueResult> {
  const supa = await admin();
  const batchSize = opts.batchSize ?? 10;
  const workerId = opts.workerId ?? `worker-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const staleLockCutoff = new Date(Date.now() - LOCK_TIMEOUT_MS).toISOString();

  // Claim a batch: pending OR (failed & retry-due) OR stale-locked processing.
  const { data: candidates, error: selErr } = await supa
    .from("sentry_webhook_queue" as never)
    .select("id,attempt_count,status,locked_at,next_retry_at")
    .or(
      `status.eq.pending,and(status.eq.failed,next_retry_at.lte.${now}),and(status.eq.processing,locked_at.lte.${staleLockCutoff})`,
    )
    .order("created_at", { ascending: true })
    .limit(batchSize);
  if (selErr) throw new Error(`claim query failed: ${selErr.message}`);
  const rows = (candidates ?? []) as Array<{ id: string; attempt_count: number }>;
  if (rows.length === 0) return { claimed: 0, completed: 0, retried: 0, deadLettered: 0 };

  const result: ProcessQueueResult = { claimed: 0, completed: 0, retried: 0, deadLettered: 0 };

  for (const row of rows) {
    // Optimistic lock: only claim if still unlocked / stale.
    const { data: locked, error: lockErr } = await supa
      .from("sentry_webhook_queue" as never)
      .update({ status: "processing", locked_at: now, locked_by: workerId } as never)
      .eq("id", row.id)
      .in("status", ["pending", "failed", "processing"])
      .or(`locked_at.is.null,locked_at.lte.${staleLockCutoff}`)
      .select("id,payload,attempt_count")
      .maybeSingle();
    if (lockErr || !locked) continue;
    result.claimed += 1;

    const evt = locked as { id: string; payload: any; attempt_count: number };
    const nextAttempt = (evt.attempt_count ?? 0) + 1;
    const issueId: string | undefined =
      evt.payload?.data?.issue?.id ??
      evt.payload?.data?.issue_id ??
      evt.payload?.data?.event?.issue?.id;

    try {
      if (!issueId) throw new Error("no issue id in payload");
      const r = await processSentryIssue({ issueId: String(issueId), trigger: "webhook" });
      if (r.status === "failed") throw new Error(r.error ?? "pipeline failure");
      await supa
        .from("sentry_webhook_queue" as never)
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          attempt_count: nextAttempt,
          locked_at: null,
          locked_by: null,
          last_error: null,
        } as never)
        .eq("id", evt.id);
      result.completed += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (nextAttempt >= MAX_ATTEMPTS) {
        await supa
          .from("sentry_webhook_queue" as never)
          .update({
            status: "failed_permanent",
            attempt_count: nextAttempt,
            last_error: msg.slice(0, 1000),
            locked_at: null,
            locked_by: null,
          } as never)
          .eq("id", evt.id);
        result.deadLettered += 1;
      } else {
        await supa
          .from("sentry_webhook_queue" as never)
          .update({
            status: "failed",
            attempt_count: nextAttempt,
            last_error: msg.slice(0, 1000),
            next_retry_at: new Date(Date.now() + backoffMs(nextAttempt)).toISOString(),
            locked_at: null,
            locked_by: null,
          } as never)
          .eq("id", evt.id);
        result.retried += 1;
      }
    }
  }

  return result;
}
