/**
 * Poll GitHub CI check runs for AI-generated PRs and persist the result.
 *
 * For each candidate PR row (state open OR ci_status pending/unknown) we:
 *   1. Fetch head SHA + PR state from GitHub.
 *   2. List check runs on that SHA.
 *   3. Upsert every check into sentry_pr_check_runs (unique on pr+name+sha).
 *   4. Aggregate to success/failure/pending and update sentry_pull_requests.
 *
 * Non-blocking: any single PR failure is captured in last_error and does
 * not stop the batch.
 */
import {
  aggregateCheckConclusion,
  getPullRequest,
  isGithubConfigured,
  listCheckRunsForRef,
} from "@/lib/github/client.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface PollCIResult {
  scanned: number;
  updated: number;
  errors: number;
  skippedReason?: string;
}

export async function pollOpenPRChecks(opts: { batchSize?: number } = {}): Promise<PollCIResult> {
  if (!isGithubConfigured()) {
    return { scanned: 0, updated: 0, errors: 0, skippedReason: "github-not-configured" };
  }
  const supa = await admin();
  const batchSize = Math.max(1, Math.min(opts.batchSize ?? 25, 100));

  const { data: rows, error } = await supa
    .from("sentry_pull_requests" as never)
    .select("id,pr_number,pr_state,ci_status")
    .not("pr_number", "is", null)
    .in("pr_state", ["open", "pending"])
    .order("ci_last_checked_at", { ascending: true, nullsFirst: true })
    .limit(batchSize);
  if (error) throw new Error(error.message);

  const candidates = (rows as Array<{
    id: string;
    pr_number: number;
    pr_state: string;
    ci_status: string;
  }> | null) ?? [];

  let updated = 0;
  let errors = 0;

  for (const row of candidates) {
    try {
      const pr = await getPullRequest(row.pr_number);
      const checks = await listCheckRunsForRef(pr.head_sha);
      const verdict = aggregateCheckConclusion(checks);

      // Upsert individual checks (idempotent on pr+name+head_sha).
      if (checks.length > 0) {
        const payload = checks.map((c) => ({
          pull_request_id: row.id,
          check_name: c.name,
          status: c.status,
          conclusion: c.conclusion,
          details_url: c.details_url ?? null,
          head_sha: pr.head_sha,
          external_id: c.external_id ?? null,
          started_at: c.started_at ?? null,
          completed_at: c.completed_at ?? null,
          observed_at: new Date().toISOString(),
        }));
        await supa
          .from("sentry_pr_check_runs" as never)
          .upsert(payload as never, {
            onConflict: "pull_request_id,check_name,head_sha",
          });
      }

      const nextPrState = pr.merged
        ? "merged"
        : pr.state === "closed"
        ? "closed"
        : "open";

      await supa
        .from("sentry_pull_requests" as never)
        .update({
          pr_state: nextPrState,
          ci_status: verdict,
          ci_conclusion: verdict === "success" || verdict === "failure" ? verdict : null,
          ci_last_checked_at: new Date().toISOString(),
          ci_head_sha: pr.head_sha,
        } as never)
        .eq("id", row.id);
      updated++;
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      await supa
        .from("sentry_pull_requests" as never)
        .update({
          ci_last_checked_at: new Date().toISOString(),
          last_error: msg.slice(0, 500),
        } as never)
        .eq("id", row.id);
    }
  }

  return { scanned: candidates.length, updated, errors };
}
