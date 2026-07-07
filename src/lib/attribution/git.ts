/**
 * GitHub commit metadata lookup. Worker-safe (fetch only).
 *
 * Env:
 *   GITHUB_TOKEN     — required for authenticated calls
 *   GITHUB_REPO      — "owner/repo" (default: higaetapple-stack/higaet-core-engine)
 */

export interface CommitInfo {
  sha: string;
  author: string;
  email: string;
  message: string;
  url?: string;
}

const DEFAULT_REPO = "higaetapple-stack/higaet";

export async function getCommitInfo(sha: string): Promise<CommitInfo | null> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? DEFAULT_REPO;
  if (!token || !sha) return null;

  const res = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    commit: { author: { name: string; email: string }; message: string };
    html_url?: string;
  };
  return {
    sha,
    author: data.commit.author.name,
    email: data.commit.author.email,
    message: data.commit.message,
    url: data.html_url,
  };
}
