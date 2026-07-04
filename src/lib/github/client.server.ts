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
  init: RequestInit & { expected?: number[] } = {},
): Promise<T> {
  const { token } = env();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": UA,
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const expected = init.expected ?? [200, 201];
  const text = await res.text();
  if (!expected.includes(res.status)) {
    throw new Error(`github ${res.status} ${path}: ${text.slice(0, 400)}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
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
