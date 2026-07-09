/**
 * End-to-end smoke test: synthetic Sentry issue → AI analysis → GitHub PR →
 * CI status poll → deployment readiness verdict.
 *
 * Runs entirely from a synthetic incident so we don't require a live
 * Sentry event; the AI, PR, and CI paths are the real production paths.
 * Every phase transition is appended to sre_e2e_test_runs.phases and
 * mirrored to logs for the admin UI.
 */
import { runAISRELoop, type AISREIncident } from "@/lib/sre/ai/orchestrator";
import { buildPRDraft, computeAnalysisHash } from "@/lib/sre/pipeline/pr-draft";
import { createPRForAnalysis } from "@/lib/sre/pipeline/create-pr.server";
import { pollOpenPRChecks } from "@/lib/sre/pipeline/poll-ci.server";
import {
  aggregateAllCiSignals,
  getPullRequest,
  isGithubConfigured,
  listCheckRunsForRef,
  listCombinedStatusForRef,
  listWorkflowRunsForRef,
} from "@/lib/github/client.server";
import { sanitizeGithubError } from "@/lib/github/sanitize";


type Phase =
  | "seed_issue"
  | "ai_analysis"
  | "open_pr"
  | "poll_ci"
  | "deployment_readiness";

type PhaseStatus = "ok" | "warn" | "failed" | "skipped";

interface PhaseEvent {
  phase: Phase;
  status: PhaseStatus;
  message: string;
  at: string;
  data?: Record<string, unknown>;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// Stable canary id so PR dedup on (issue_id, analysis_hash) collapses
// repeated smoke runs into a single draft PR instead of spamming one per run.
// runId still keys sre_e2e_test_runs; only the synthetic Sentry issue id is fixed.
export const E2E_SYNTHETIC_ISSUE_ID = "e2e-smoke-canary";
export const E2E_SYNTHETIC_SHORT_ID = "E2E-CANARY";

function syntheticIncident(_runId: string): { incident: AISREIncident; issueId: string } {
  const issueId = E2E_SYNTHETIC_ISSUE_ID;
  return {
    issueId,
    incident: {
      id: issueId,
      shortId: E2E_SYNTHETIC_SHORT_ID,
      permalink: undefined,
      // Synthetic, human-readable title. Intentionally NOT a real stack-trace
      // string — the previous "TypeError: Cannot read properties of undefined"
      // wording made every draft PR look like a genuine incident.
      title: "E2E smoke canary: synthetic SRE pipeline health check",
      culprit: "src/lib/sre/pipeline/e2e-test.server.ts in syntheticIncident",
      errorType: "SyntheticCanary",
      errorValue: "SRE E2E smoke run (not a real incident)",
      frequency: 1,
      userCount: 0,
      frames: [
        {
          filename: "src/lib/sre/pipeline/process-issue.server.ts",
          function: "processSentryIssue",
        },
        {
          filename: "src/lib/sre/pipeline/create-pr.server.ts",
          function: "createPRForAnalysis",
        },
      ],
    },
  };
}

// Test-only accessor so the canary shape can be asserted without re-running the
// full pipeline. Not part of the public runtime API.
export function __getSyntheticIncidentForTest(runId: string) {
  return syntheticIncident(runId);
}

async function appendPhase(runId: string, event: Omit<PhaseEvent, "at">, patch: Record<string, unknown> = {}) {
  const supa = await admin();
  const { data: cur } = await supa
    .from("sre_e2e_test_runs" as never)
    .select("phases")
    .eq("id", runId)
    .single();
  const phases = (((cur as { phases?: PhaseEvent[] } | null)?.phases) ?? []).concat({
    ...event,
    at: new Date().toISOString(),
  });
  await supa
    .from("sre_e2e_test_runs" as never)
    .update({ phases, current_phase: event.phase, ...patch } as never)
    .eq("id", runId);
}

async function startRun(triggeredBy: string | null): Promise<string> {
  const supa = await admin();
  const { data, error } = await supa
    .from("sre_e2e_test_runs" as never)
    .insert({
      triggered_by: triggeredBy,
      status: "running",
      current_phase: "seed_issue",
      phases: [],
    } as never)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

async function finalize(runId: string, patch: Record<string, unknown>) {
  const supa = await admin();
  await supa
    .from("sre_e2e_test_runs" as never)
    .update({ finished_at: new Date().toISOString(), ...patch } as never)
    .eq("id", runId);
}

export interface RunE2ETestOptions {
  triggeredBy?: string | null;
  ciPollAttempts?: number;
  ciPollIntervalMs?: number;
  ciInitialDelayMs?: number;
}

export interface RunE2ETestResult {
  runId: string;
  status: "passed" | "failed" | "pending";
  prUrl?: string;
  ciConclusion?: string;
  readyForDeploy: boolean | null;
}


export async function runSreE2ETest(opts: RunE2ETestOptions = {}): Promise<RunE2ETestResult> {
  const triggeredBy = opts.triggeredBy ?? null;
  const runId = await startRun(triggeredBy);
  const { incident, issueId } = syntheticIncident(runId);

  await appendPhase(runId, {
    phase: "seed_issue",
    status: "ok",
    message: `Seeded synthetic issue ${issueId}`,
    data: { issueId },
  }, { sample_issue_id: issueId });

  // 1. AI analysis (in-process, deterministic).
  let analysis;
  try {
    analysis = runAISRELoop(incident);
    await appendPhase(runId, {
      phase: "ai_analysis",
      status: "ok",
      message: `AI produced ${analysis.fixPlan.length} fix step(s), category=${analysis.rootCause.topCategory}, confidence=${analysis.rootCause.confidence.toFixed(2)}`,
    });
  } catch (err) {
    const msg = sanitizeGithubError(err);
    await appendPhase(runId, { phase: "ai_analysis", status: "failed", message: msg });
    await finalize(runId, { status: "failed", error: msg, ready_for_deploy: false });
    return { runId, status: "failed", readyForDeploy: false };
  }

  // 2. Open PR (skipped if GitHub not configured).
  if (!isGithubConfigured()) {
    await appendPhase(runId, {
      phase: "open_pr",
      status: "skipped",
      message: "GITHUB_TOKEN / GITHUB_REPO not configured — cannot open PR",
    });
    await finalize(runId, { status: "failed", error: "github-not-configured", ready_for_deploy: false });
    return { runId, status: "failed", readyForDeploy: false };
  }

  const hash = computeAnalysisHash(analysis);
  const draft = buildPRDraft(analysis, {
    id: issueId,
    shortId: incident.shortId,
    title: incident.title ?? "E2E synthetic incident",
  });

  let prUrl: string | undefined;
  let prNumber: number | undefined;
  let prRowId: string | undefined;
  try {
    const pr = await createPRForAnalysis({ issueId, analysisHash: hash, analysis, draft });
    if (pr.status === "failed") throw new Error(pr.reason);
    if (pr.status === "skipped") throw new Error(`skipped: ${pr.reason}`);
    prUrl = pr.url;
    prNumber = pr.number;
    prRowId = pr.status === "created" || pr.status === "reused" ? pr.id : undefined;
    await appendPhase(runId, {
      phase: "open_pr",
      status: "ok",
      message: `PR ${pr.status}: #${pr.number ?? "?"} (${(pr.confidence * 100).toFixed(1)}% confidence)`,
      data: { url: pr.url, number: pr.number, confidence: pr.confidence },
    }, { pull_request_id: prRowId, pr_url: prUrl ?? null });
  } catch (err) {
    const msg = sanitizeGithubError(err);
    await appendPhase(runId, { phase: "open_pr", status: "failed", message: msg });
    await finalize(runId, { status: "failed", error: msg, ready_for_deploy: false });
    return { runId, status: "failed", readyForDeploy: false };
  }

  // 3. Poll CI checks — bounded, but keep going while checks are pending or
  //    haven't registered yet (verdict "unknown" == zero checks visible).
  //    Bounds also enforced by scripts/check-sre-production-readiness.ts.
  const envAttempts = Number(process.env.SRE_CI_POLL_ATTEMPTS);
  const envInterval = Number(process.env.SRE_CI_POLL_INTERVAL_MS);
  const envInitial = Number(process.env.SRE_CI_INITIAL_DELAY_MS);
  const attempts = Math.max(
    1,
    Math.min(opts.ciPollAttempts ?? (Number.isFinite(envAttempts) ? envAttempts : 40), 120),
  );
  const intervalMs = Math.max(
    1000,
    Math.min(opts.ciPollIntervalMs ?? (Number.isFinite(envInterval) ? envInterval : 10000), 60000),
  );
  const initialDelayMs = Math.max(
    0,
    Math.min(opts.ciInitialDelayMs ?? (Number.isFinite(envInitial) ? envInitial : 15000), 60000),
  );

  console.log(
    JSON.stringify({
      evt: "sre_e2e_poll_config",
      runId,
      attempts,
      intervalMs,
      initialDelayMs,
      maxWaitMs: initialDelayMs + attempts * intervalMs,
    }),
  );

  let ciVerdict: "success" | "failure" | "pending" | "unknown" = "unknown";
  let lastCheckCount = 0;
  if (prNumber) {
    if (initialDelayMs > 0) {
      await appendPhase(runId, {
        phase: "poll_ci",
        status: "warn",
        message: `Waiting ${Math.round(initialDelayMs / 1000)}s for GitHub to register check runs`,
        data: { initialDelayMs },
      });
      await new Promise((r) => setTimeout(r, initialDelayMs));
    }



    for (let i = 0; i < attempts; i++) {
      try {
        // Reuse the shared batch poller so results land in sentry_pr_check_runs.
        await pollOpenPRChecks({ batchSize: 5 });
        const pr = await getPullRequest(prNumber);
        const [checks, combined, workflows] = await Promise.all([
          listCheckRunsForRef(pr.head_sha),
          listCombinedStatusForRef(pr.head_sha).catch((err) => {
            console.warn(`[sre-e2e] combined-status fetch failed: ${sanitizeGithubError(err)}`);
            return null;
          }),
          listWorkflowRunsForRef(pr.head_sha).catch((err) => {
            console.warn(`[sre-e2e] workflow-runs fetch failed: ${sanitizeGithubError(err)}`);
            return [];
          }),
        ]);
        const agg = aggregateAllCiSignals({
          checkRuns: checks,
          combinedStatus: combined,
          workflowRuns: workflows,
        });
        ciVerdict = agg.verdict;
        lastCheckCount = checks.length + workflows.length + (combined?.total_count ?? 0);

        // Structured log for observability (parsed by log pipeline).
        console.log(
          JSON.stringify({
            evt: "sre_e2e_poll",
            runId,
            prNumber,
            headSha: pr.head_sha,
            attempt: i + 1,
            checkRuns: checks.map((c) => ({ name: c.name, status: c.status, conclusion: c.conclusion })),
            statuses: combined?.statuses.map((s) => ({ context: s.context, state: s.state })) ?? [],
            workflowRuns: workflows.map((w) => ({ name: w.name, status: w.status, conclusion: w.conclusion })),
            verdict: agg.verdict,
            reasons: agg.reasons,
          }),
        );

        const effective: "success" | "failure" | "pending" =
          agg.verdict === "success"
            ? "success"
            : agg.verdict === "failure"
            ? "failure"
            : "pending";
        await appendPhase(runId, {
          phase: "poll_ci",
          status:
            effective === "failure" ? "failed" : effective === "success" ? "ok" : "warn",
          message: `Attempt ${i + 1}/${attempts}: ${checks.length} check-run(s), ${workflows.length} workflow-run(s), ${
            combined?.total_count ?? 0
          } status(es) — verdict=${effective}${
            agg.verdict === "unknown" ? " (no CI signals visible yet)" : ""
          }`,
          data: {
            attempt: i + 1,
            headSha: pr.head_sha,
            checkRuns: checks.length,
            workflowRuns: workflows.length,
            statuses: combined?.total_count ?? 0,
            verdict: effective,
            rawVerdict: agg.verdict,
            reasons: agg.reasons.slice(0, 10),
          },
        });
        if (effective === "success" || effective === "failure") break;
      } catch (err) {
        const msg = sanitizeGithubError(err);
        console.warn(`[sre-e2e] poll attempt ${i + 1} error: ${msg}`);
        await appendPhase(runId, {
          phase: "poll_ci",
          status: "warn",
          message: `Attempt ${i + 1} error: ${msg}`,
        });
      }
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  // 4. Deployment readiness verdict.
  //    success  → ready to deploy         (status=passed, ready=true)
  //    failure  → CI blocked              (status=failed, ready=false)
  //    pending  → still waiting on checks (status=pending, ready=null)
  const effectiveVerdict: "success" | "failure" | "pending" =
    ciVerdict === "success"
      ? "success"
      : ciVerdict === "failure"
      ? "failure"
      : "pending";

  const readyForDeploy: boolean | null =
    effectiveVerdict === "success"
      ? true
      : effectiveVerdict === "failure"
      ? false
      : null;

  const overallStatus: "passed" | "failed" | "pending" =
    effectiveVerdict === "success"
      ? "passed"
      : effectiveVerdict === "failure"
      ? "failed"
      : "pending";

  await appendPhase(runId, {
    phase: "deployment_readiness",
    status:
      effectiveVerdict === "success"
        ? "ok"
        : effectiveVerdict === "failure"
        ? "failed"
        : "warn",
    message:
      effectiveVerdict === "success"
        ? "All required CI checks passed — safe to deploy"
        : effectiveVerdict === "failure"
        ? "CI reported failure — deployment blocked"
        : `CI still pending after ${attempts} polls (${lastCheckCount} check(s) seen) — human review required`,
    data: { ciVerdict: effectiveVerdict, rawVerdict: ciVerdict, checks: lastCheckCount },
  });

  await finalize(runId, {
    status: overallStatus,
    ci_conclusion: effectiveVerdict,
    ready_for_deploy: readyForDeploy,
    error: null,
  });

  console.log(
    JSON.stringify({
      evt: "sre_e2e_decision",
      runId,
      prNumber,
      prUrl,
      ciVerdict: effectiveVerdict,
      rawVerdict: ciVerdict,
      readyForDeploy,
      overallStatus,
      signalsSeen: lastCheckCount,
    }),
  );

  return { runId, status: overallStatus, prUrl, ciConclusion: effectiveVerdict, readyForDeploy };
}

