import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminGetSentryReleases,
  type ReleasesPayload,
} from "@/lib/sentry-releases.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

const releasesQuery = () =>
  queryOptions({
    queryKey: ["admin", "sentry-releases"],
    queryFn: () => adminGetSentryReleases() as Promise<ReleasesPayload>,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export const Route = createFileRoute("/_authenticated/dashboard/admin/sentry-releases")({
  head: () => ({
    meta: [
      { title: "Sentry Releases — AI SRE" },
      { name: "description", content: "Read-only view of recent Sentry releases and pipeline status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(releasesQuery()),
  component: SentryReleasesPage,
  errorComponent: ({ error }) => (
    <div className="p-6">
      <Card className="p-5 border-destructive/40">
        <h1 className="font-semibold text-destructive mb-2">Could not load releases</h1>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </Card>
    </div>
  ),
});

function StageDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

function SentryReleasesPage() {
  const { data } = useSuspenseQuery(releasesQuery());
  const qc = useQueryClient();
  const refetch = useServerFn(adminGetSentryReleases);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const fresh = await refetch();
      qc.setQueryData(["admin", "sentry-releases"], fresh);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sentry Releases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only advisory view. Auto-refreshes every 60s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {!data.configured && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Sentry not configured</p>
            <p className="text-muted-foreground">
              Set <code>SENTRY_AUTH_TOKEN</code> to enable release visibility.
            </p>
          </div>
        </Card>
      )}

      {data.reason && data.configured && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm">
          {data.reason}
        </Card>
      )}

      <div className="space-y-3">
        {data.items.length === 0 && data.configured && !data.reason && (
          <Card className="p-6 text-sm text-muted-foreground text-center">
            No releases returned yet.
          </Card>
        )}
        {data.items.map((r) => (
          <Card key={r.version} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono truncate">{r.shortVersion ?? r.version}</code>
                  {r.projects.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                  {typeof r.newGroups === "number" && r.newGroups > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {r.newGroups} new issues
                    </Badge>
                  )}
                </div>
                {r.lastCommitMessage && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {r.lastCommitMessage}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <StageDot ok={r.stages.created} label="Created" />
                  <StageDot ok={r.stages.sourcemaps_uploaded} label="Sourcemaps uploaded" />
                  <StageDot ok={r.stages.commits_linked} label={`${r.commitCount} commits linked`} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {r.createdAt && <>created {new Date(r.createdAt).toLocaleString()} · </>}
                  {r.releasedAt && <>released {new Date(r.releasedAt).toLocaleString()}</>}
                </div>
              </div>
              <a
                href={r.permalink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary inline-flex items-center gap-1 whitespace-nowrap"
              >
                Open in Sentry <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
