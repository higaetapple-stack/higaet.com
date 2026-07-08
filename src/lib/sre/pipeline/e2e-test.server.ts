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

function syntheticIncident(runId: string): { incident: AISREIncident; issueId: string } {
  const issueId = `e2e-${runId.slice(0, 8)}`;
  return {
    issueId,
    incident: {
      id: issueId,
      shortId: `E2E-${runId.slice(0, 6).toUpperCase()}`,
      permalink: undefined,
      title: "E2E smoke: TypeError: Cannot read properties of undefined (reading 'id')",
      culprit: "src/lib/e2e/synthetic.ts in loadUser",
      errorType: "TypeError",
      errorValue: "Cannot read properties of undefined (reading 'id')",
      frequency: 42,
      userCount: 7,
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
    const msg = err instanceof Error ? err.message : String(err);
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
    const msg = err instanceof Error ? err.message : String(err);
    await appendPhase(runId, { phase: "open_pr", status: "failed", message: msg });
    await finalize(runId, { status: "failed", error: msg, ready_for_deploy: false });
    return { runId, status: "failed", readyForDeploy: false };
  }

  // 3. Poll CI checks — bounded, but keep going while checks are pending or
  //    haven't registered yet (verdict "unknown" == zero checks visible).
  const attempts = Math.max(1, Math.min(opts.ciPollAttempts ?? 40, 60));
  const intervalMs = Math.max(5000, Math.min(opts.ciPollIntervalMs ?? 10000, 30000));
  const initialDelayMs = Math.max(0, Math.min(opts.ciInitialDelayMs ?? 15000, 60000));

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
        const checks = await listCheckRunsForRef(pr.head_sha);
        lastCheckCount = checks.length;
        ciVerdict = aggregateCheckConclusion(checks);
        // Treat zero-checks ("unknown") as pending — the check-suite may not
        // have registered yet. Do not exit the poll loop on unknown/pending.
        const effective: "success" | "failure" | "pending" =
          ciVerdict === "success"
            ? "success"
            : ciVerdict === "failure"
            ? "failure"
            : "pending";
        await appendPhase(runId, {
          phase: "poll_ci",
          status:
            effective === "failure" ? "failed" : effective === "success" ? "ok" : "warn",
          message: `Attempt ${i + 1}/${attempts}: ${checks.length} check(s), verdict=${effective}${
            ciVerdict === "unknown" ? " (no checks registered yet)" : ""
          }`,
          data: {
            attempt: i + 1,
            checks: checks.length,
            verdict: effective,
            rawVerdict: ciVerdict,
          },
        });
        if (effective === "success" || effective === "failure") break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
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

  return { runId, status: overallStatus, prUrl, ciConclusion: effectiveVerdict, readyForDeploy };
}

