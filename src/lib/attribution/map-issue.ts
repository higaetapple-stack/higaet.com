/**
 * Map a Sentry issue → the commit that likely introduced it. Best-effort:
 * confidence drops fast when the release tag or GitHub token is missing.
 */

import { getCommitInfo, type CommitInfo } from "./git";
import { extractShaFromRelease } from "@/lib/observability/release";

export interface AttributionResult {
  confidence: number;
  reason?: string;
  commit?: CommitInfo;
  release?: string;
}

interface IssueLike {
  release?: string | null;
  tags?: Array<{ key?: string; value?: string }> | Record<string, string> | null;
}

function pickRelease(issue: IssueLike): string | null {
  if (issue.release) return issue.release;
  const tags = issue.tags;
  if (!tags) return null;
  if (Array.isArray(tags)) {
    const t = tags.find((x) => x?.key === "release");
    return t?.value ?? null;
  }
  return tags.release ?? null;
}

export async function mapIssueToCommit(issue: IssueLike): Promise<AttributionResult> {
  const release = pickRelease(issue);
  if (!release) return { confidence: 0, reason: "No release tag on issue" };

  const sha = extractSha(release);
  const commit = await getCommitInfo(sha);
  if (!commit) {
    return { confidence: 0.3, reason: "Commit not found in GitHub", release };
  }
  return { confidence: 0.9, commit, release };
}
