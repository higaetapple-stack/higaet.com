/**
 * Minimal GitHub REST client used by the AI SRE PR layer.
 *
 * Server-only. Reads GITHUB_TOKEN + GITHUB_REPO at call time (per
 * TanStack rules — never at module scope). GITHUB_REPO is `owner/repo`.
 *
 * Scope kept intentionally small:
 *   - resolve default branch
 *   - get the head commit sha of a branch
 *   - ensure a branch exists (create from base if missing)
 *   - commit a single file (create-or-update) to a branch
 *   - open a PR (idempotent via head branch)
 *   - add labels to a PR
 *
 * Every call throws a typed Error whose message includes HTTP status +
 * GitHub error text so upstream callers can persist last_error verbatim.
 */

const API = "https://api.github.com";
const UA = "higaet-ai-sre/1.0";

function env() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/repo"
  if (!token || !repo) {
    throw new Error("github-not-configured");
  }
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`invalid GITHUB_REPO: ${repo}`);
  return { token, owner, repo: name, slug: repo };
}

export function isGithubConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO?.includes("/"));
}

async function gh<T = unknown>(
  path: string,
  init: RequestInit & { expected?: number[]; timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const { token } = env();
  const expected = init.expected ?? [200, 201];
  const timeoutMs = init.timeoutMs ?? 15000;
  const method = (init.method ?? "GET").toUpperCase();
  const isIdempotent = method === "GET" || method === "HEAD";
  const maxAttempts = Math.max(1, init.retries ?? (isIdempotent ? 3 : 1));

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${API}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": UA,
          Authorization: `Bearer ${token}`,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...(init.headers ?? {}),
        },
      });
      const text = await res.text();
      if (!expected.includes(res.status)) {
        // Retry transient 5xx and 429 on idempotent calls; surface 401/403/404 immediately.
        const transient = res.status >= 500 || res.status === 429;
        if (transient && isIdempotent && attempt < maxAttempts) {
          const retryAfter = Number(res.headers.get("retry-after")) || attempt;
          await new Promise((r) => setTimeout(r, Math.min(retryAfter * 1000, 5000)));
          continue;
        }
        throw new Error(`github ${res.status} ${path}: ${text.slice(0, 400)}`);
      }
      return (text ? JSON.parse(text) : {}) as T;
    } catch (e) {
      lastErr = e;
      const isAbort = (e as { name?: string })?.name === "AbortError";
      if (isIdempotent && attempt < maxAttempts && (isAbort || !(e instanceof Error && e.message.startsWith("github ")))) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}


export async function getDefaultBranch(): Promise<string> {
  const { owner, repo } = env();
  const info = await gh<{ default_branch: string }>(`/repos/${owner}/${repo}`);
  return info.default_branch;
}

export async function getBranchSha(branch: string): Promise<string | null> {
  const { owner, repo } = env();
  try {
    const ref = await gh<{ object: { sha: string } }>(
      `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
      { expected: [200] },
    );
    return ref.object.sha;
  } catch (e) {
    if ((e as Error).message.includes("github 404")) return null;
    throw e;
  }
}

/** Ensure a branch exists on origin. Returns { created, sha }. */
export async function ensureBranch(
  branch: string,
  baseBranch: string,
): Promise<{ created: boolean; sha: string }> {
  const existing = await getBranchSha(branch);
  if (existing) return { created: false, sha: existing };

  const { owner, repo } = env();
  const baseSha = await getBranchSha(baseBranch);
  if (!baseSha) throw new Error(`base branch missing: ${baseBranch}`);

  await gh(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });
  return { created: true, sha: baseSha };
}

/** Create or update a file on a branch. Returns the new commit SHA. */
export async function commitFile(input: {
  branch: string;
  path: string;
  content: string;
  message: string;
}): Promise<string> {
  const { owner, repo } = env();
  // Look up existing file SHA on the branch (needed for update).
  let existingSha: string | undefined;
  try {
    const cur = await gh<{ sha: string }>(
      `/repos/${owner}/${repo}/contents/${encodeURI(input.path)}?ref=${encodeURIComponent(input.branch)}`,
      { expected: [200] },
    );
    existingSha = cur.sha;
  } catch (e) {
    if (!(e as Error).message.includes("github 404")) throw e;
  }

  const body = {
    message: input.message,
    branch: input.branch,
    content: Buffer.from(input.content, "utf8").toString("base64"),
    ...(existingSha ? { sha: existingSha } : {}),
  };
  const res = await gh<{ commit: { sha: string } }>(
    `/repos/${owner}/${repo}/contents/${encodeURI(input.path)}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
  return res.commit.sha;
}

/**
 * Open a PR head→base. Idempotent: if a PR with the same head branch
 * already exists (open OR closed), returns it instead of erroring.
 */
export async function openPullRequest(input: {
  head: string;
  base: string;
  title: string;
  body: string;
  draft?: boolean;
}): Promise<{ number: number; url: string; state: string; created: boolean }> {
  const { owner, repo } = env();
  const existing = await gh<Array<{ number: number; html_url: string; state: string }>>(
    `/repos/${owner}/${repo}/pulls?head=${encodeURIComponent(`${owner}:${input.head}`)}&state=all&per_page=1`,
    { expected: [200] },
  );
  if (existing.length > 0) {
    const p = existing[0];
    return { number: p.number, url: p.html_url, state: p.state, created: false };
  }
  const created = await gh<{ number: number; html_url: string; state: string }>(
    `/repos/${owner}/${repo}/pulls`,
    {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        head: input.head,
        base: input.base,
        body: input.body,
        draft: input.draft ?? false,
      }),
    },
  );
  return { number: created.number, url: created.html_url, state: created.state, created: true };
}

export async function addLabels(prNumber: number, labels: string[]): Promise<void> {
  if (labels.length === 0) return;
  const { owner, repo } = env();
  await gh(`/repos/${owner}/${repo}/issues/${prNumber}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels }),
    expected: [200, 201],
  });
}

export interface GhCheckRun {
  name: string;
  status: "queued" | "in_progress" | "completed" | string;
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "timed_out"
    | "action_required"
    | "skipped"
    | null;
  details_url?: string | null;
  external_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

/** Look up head SHA + state for a PR (needed before polling checks). */
export async function getPullRequest(prNumber: number): Promise<{
  head_sha: string;
  state: string;
  merged: boolean;
}> {
  const { owner, repo } = env();
  const pr = await gh<{ head: { sha: string }; state: string; merged: boolean }>(
    `/repos/${owner}/${repo}/pulls/${prNumber}`,
    { expected: [200] },
  );
  return { head_sha: pr.head.sha, state: pr.state, merged: pr.merged };
}

/** List check runs for a commit SHA (GitHub Actions + third-party checks). */
export async function listCheckRunsForRef(sha: string): Promise<GhCheckRun[]> {
  const { owner, repo } = env();
  const res = await gh<{ check_runs: GhCheckRun[] }>(
    `/repos/${owner}/${repo}/commits/${encodeURIComponent(sha)}/check-runs?per_page=100`,
    { expected: [200] },
  );
  return res.check_runs ?? [];
}

/**
 * Aggregate a list of check runs into a single pipeline verdict.
 *  - failure  → any check concluded failure/cancelled/timed_out/action_required
 *  - pending  → any check still queued/in_progress
 *  - success  → every check completed with success/neutral/skipped
 */
export function aggregateCheckConclusion(
  checks: GhCheckRun[],
): "success" | "failure" | "pending" | "unknown" {
  if (checks.length === 0) return "unknown";
  const bad = new Set(["failure", "cancelled", "timed_out", "action_required"]);
  const ok = new Set(["success", "neutral", "skipped"]);
  let anyPending = false;
  for (const c of checks) {
    if (c.status !== "completed") {
      anyPending = true;
      continue;
    }
    if (c.conclusion && bad.has(c.conclusion)) return "failure";
    if (!c.conclusion || !ok.has(c.conclusion)) return "failure";
  }
  return anyPending ? "pending" : "success";
}

/**
 * Legacy commit-status API — many repos publish parity/CI signals as
 * commit statuses rather than check runs. Combined endpoint returns the
 * rolled-up state ("success" | "failure" | "pending" | "error").
 */
export interface GhCombinedStatus {
  state: "success" | "failure" | "pending" | "error";
  total_count: number;
  statuses: Array<{
    context: string;
    state: "success" | "failure" | "pending" | "error";
    target_url?: string | null;
    description?: string | null;
  }>;
}

export async function listCombinedStatusForRef(sha: string): Promise<GhCombinedStatus> {
  const { owner, repo } = env();
  return gh<GhCombinedStatus>(
    `/repos/${owner}/${repo}/commits/${encodeURIComponent(sha)}/status?per_page=100`,
    { expected: [200] },
  );
}

/**
 * List GitHub Actions workflow runs targeting a specific commit SHA.
 * Useful when workflows have started but check runs / statuses haven't
 * been indexed yet.
 */
export interface GhWorkflowRun {
  name: string;
  status: "queued" | "in_progress" | "completed" | string;
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | "startup_failure"
    | null;
  html_url: string;
  head_sha: string;
}

export async function listWorkflowRunsForRef(sha: string): Promise<GhWorkflowRun[]> {
  const { owner, repo } = env();
  const res = await gh<{ workflow_runs: GhWorkflowRun[] }>(
    `/repos/${owner}/${repo}/actions/runs?head_sha=${encodeURIComponent(sha)}&per_page=100`,
    { expected: [200] },
  );
  return res.workflow_runs ?? [];
}

export interface AggregatedCiSignals {
  verdict: "success" | "failure" | "pending" | "unknown";
  checkRuns: GhCheckRun[];
  workflowRuns: GhWorkflowRun[];
  combinedStatus: GhCombinedStatus | null;
  reasons: string[];
}

/**
 * Combined CI verdict across check-runs + commit statuses + workflow runs.
 * Any failure signal wins; else any pending signal → pending; else if we
 * saw ≥1 successful signal → success; else unknown (no signals visible yet).
 */
export function aggregateAllCiSignals(input: {
  checkRuns: GhCheckRun[];
  combinedStatus: GhCombinedStatus | null;
  workflowRuns: GhWorkflowRun[];
}): AggregatedCiSignals {
  const reasons: string[] = [];
  const badConclusion = new Set([
    "failure",
    "cancelled",
    "timed_out",
    "action_required",
    "startup_failure",
  ]);
  const okConclusion = new Set(["success", "neutral", "skipped"]);

  let anyFailure = false;
  let anyPending = false;
  let anySuccess = false;

  for (const c of input.checkRuns) {
    if (c.status !== "completed") {
      anyPending = true;
      reasons.push(`check "${c.name}" ${c.status}`);
      continue;
    }
    if (c.conclusion && badConclusion.has(c.conclusion)) {
      anyFailure = true;
      reasons.push(`check "${c.name}" ${c.conclusion}`);
    } else if (c.conclusion && okConclusion.has(c.conclusion)) {
      anySuccess = true;
    } else {
      anyFailure = true;
      reasons.push(`check "${c.name}" unknown conclusion`);
    }
  }

  if (input.combinedStatus && input.combinedStatus.total_count > 0) {
    for (const s of input.combinedStatus.statuses) {
      if (s.state === "failure" || s.state === "error") {
        anyFailure = true;
        reasons.push(`status "${s.context}" ${s.state}`);
      } else if (s.state === "pending") {
        anyPending = true;
        reasons.push(`status "${s.context}" pending`);
      } else if (s.state === "success") {
        anySuccess = true;
      }
    }
  }

  for (const w of input.workflowRuns) {
    if (w.status !== "completed") {
      anyPending = true;
      reasons.push(`workflow "${w.name}" ${w.status}`);
      continue;
    }
    if (w.conclusion && badConclusion.has(w.conclusion)) {
      anyFailure = true;
      reasons.push(`workflow "${w.name}" ${w.conclusion}`);
    } else if (w.conclusion && okConclusion.has(w.conclusion)) {
      anySuccess = true;
    }
  }

  let verdict: "success" | "failure" | "pending" | "unknown";
  if (anyFailure) verdict = "failure";
  else if (anyPending) verdict = "pending";
  else if (anySuccess) verdict = "success";
  else verdict = "unknown";

  return {
    verdict,
    checkRuns: input.checkRuns,
    workflowRuns: input.workflowRuns,
    combinedStatus: input.combinedStatus,
    reasons,
  };
}
