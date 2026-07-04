/** Fetch a PR unified diff from GitHub. Worker-safe. */

const DEFAULT_REPO = "higaetapple-stack/higaet-core-engine";

export async function getPRDiff(prNumber: number): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? DEFAULT_REPO;
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const res = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3.diff",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}: failed to fetch PR #${prNumber}`);
  }
  return res.text();
}
