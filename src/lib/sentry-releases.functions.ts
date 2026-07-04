/**
 * Admin-gated server function — surfaces recent Sentry releases and their
 * pipeline status (created → sourcemaps → commits) in read-only mode.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SentryClient } from "@/lib/sre/ai/sentry-client";

export type ReleaseStage = "created" | "sourcemaps_uploaded" | "commits_linked";

export interface ReleaseSummaryItem {
  version: string;
  shortVersion?: string;
  createdAt?: string;
  releasedAt?: string;
  commitCount: number;
  newGroups?: number;
  projects: string[];
  permalink: string;
  stages: Record<ReleaseStage, boolean>;
  lastCommitMessage?: string;
}

export interface ReleasesPayload {
  configured: boolean;
  timestamp: number;
  items: ReleaseSummaryItem[];
  reason?: string;
}

async function assertAdmin(ctx: {
  supabase: {
    rpc: (
      name: "has_role",
      args: { _user_id: string; _role: "admin" | "super_admin" },
    ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  };
  userId: string;
}) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (isAdmin) return;
  const { data: isSuper } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin",
  });
  if (!isSuper) throw new Error("Forbidden");
}

export const adminGetSentryReleases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReleasesPayload> => {
    await assertAdmin(context as never);
    const client = new SentryClient();
    if (!client.isConfigured()) {
      return {
        configured: false,
        timestamp: Date.now(),
        items: [],
        reason: "SENTRY_AUTH_TOKEN is not configured",
      };
    }
    try {
      const releases = await client.listReleases({ limit: 15 });
      const items: ReleaseSummaryItem[] = releases.map((r) => ({
        version: r.version,
        shortVersion: r.shortVersion,
        createdAt: r.dateCreated,
        releasedAt: r.dateReleased,
        commitCount: r.commitCount,
        newGroups: r.newGroups,
        projects: r.projects,
        permalink: r.permalink,
        lastCommitMessage: r.lastCommit?.message,
        stages: {
          created: Boolean(r.dateCreated),
          // Sentry doesn't expose sourcemap-count directly on the release
          // listing; use `dateReleased` as a proxy for the finalize step
          // (finalize typically follows the upload).
          sourcemaps_uploaded: Boolean(r.dateReleased),
          commits_linked: r.commitCount > 0 || Boolean(r.lastCommit),
        },
      }));
      return { configured: true, timestamp: Date.now(), items };
    } catch (err) {
      return {
        configured: true,
        timestamp: Date.now(),
        items: [],
        reason: (err as Error).message,
      };
    }
  });
