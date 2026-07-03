import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminGetSentryInsights,
  type SentryInsightsPayload,
  type SentryInsightsSummaryItem,
} from "@/lib/sentry-insights.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Rewind, ShieldCheck, Sparkles } from "lucide-react";

const sentryInsightsQuery = () =>
  queryOptions({
    queryKey: ["admin", "sentry-insights"],
    queryFn: () => adminGetSentryInsights() as Promise<SentryInsightsPayload>,
    staleTime: 30_000,
  });

export const Route = createFileRoute("/_authenticated/dashboard/admin/sentry")({
  head: () => ({
    meta: [
      { title: "AI SRE — Sentry Intelligence" },
      { name: "description", content: "Live Sentry incident intelligence, root-cause hypotheses and advisory fix plans." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sentryInsightsQuery()),
  component: SentryInsightsPage,
  errorComponent: ({ error }) => (
    <div className="p-6">
      <Card className="p-5 border-destructive/40">
        <h1 className="font-semibold text-destructive mb-2">Could not load Sentry insights</h1>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </Card>
    </div>
  ),
});

function SentryInsightsPage() {
  const { data } = useSuspenseQuery(sentryInsightsQuery());
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const refetch = useServerFn(adminGetSentryInsights);

  async function refresh() {
    setRefreshing(true);
    try {
      const fresh = await refetch();
      qc.setQueryData(["admin", "sentry-insights"], fresh);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="size-5" /> AI SRE — Sentry Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only, advisory. Never opens PRs or mutates provider state.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`size-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {!data.configured && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">Sentry not configured</div>
            <p className="text-muted-foreground">
              Add <code>SENTRY_AUTH_TOKEN</code> (and optionally <code>SENTRY_ORG_SLUG</code> /{" "}
              <code>SENTRY_PROJECT_SLUG</code>) to activate the live loop. The engine stays
              functional and safely no-ops without it.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Scanned issues" value={data.scanned} />
        <Stat label="Auto-PR recommended" value={data.autoPRRecommendedCount} />
        <Stat label="Systemic incidents" value={data.items.filter((i) => i.systemic).length} />
        <Stat label="Last updated" value={new Date(data.timestamp).toLocaleTimeString()} />
      </div>

      <section className="space-y-4">
        {data.items.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            {data.configured
              ? "No unresolved issues in the current sweep. 🎉"
              : "No live sweep — configure Sentry auth token to populate this view."}
          </Card>
        ) : (
          data.items.map((item) => <IncidentCard key={item.issueId} item={item} />)
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}

function IncidentCard({ item }: { item: SentryInsightsSummaryItem }) {
  const [prOpen, setPrOpen] = useState(false);
  const conf = Math.round(item.confidence * 100);
  const confTone =
    conf >= 70 ? "default" : conf >= 40 ? "secondary" : ("outline" as const);
  return (
    <Card className="p-5 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              {item.shortId ?? item.issueId}
            </Badge>
            <Badge variant="outline" className="capitalize">{item.topCategory}</Badge>
            {item.systemic && <Badge variant="destructive">systemic</Badge>}
            {item.autoPRRecommended && (
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="size-3" /> auto-PR eligible
              </Badge>
            )}
          </div>
          <h3 className="font-semibold truncate">{item.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge variant={confTone}>{conf}% confidence</Badge>
          <Button asChild variant="outline" size="sm">
            <Link
              to="/dashboard/admin/incident-replay/$issueId"
              params={{ issueId: item.issueId }}
            >
              <Rewind className="size-3 mr-1" /> Replay
            </Link>
          </Button>
        </div>
      </header>

      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Root-cause hypotheses
        </div>
        <ul className="space-y-1 text-sm">
          {item.hypotheses.map((h, i) => (
            <li key={i} className="flex items-baseline gap-2">
              <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                {h.category}
              </Badge>
              <span className="text-ink">{h.description}</span>
              <span className="text-muted-foreground text-xs ml-auto shrink-0">
                w={h.weight.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {item.fixPlan.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Suggested fix plan
          </div>
          <ul className="space-y-2 text-sm">
            {item.fixPlan.map((f, i) => (
              <li key={i} className="rounded border border-border/50 p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={f.risk === "high" ? "destructive" : f.risk === "medium" ? "secondary" : "outline"}
                    className="text-[10px]"
                  >
                    {f.risk}
                  </Badge>
                  <span className="font-medium">{f.action}</span>
                </div>
                <div className="text-xs text-muted-foreground grid gap-0.5">
                  <div>target: <code>{f.targetHint}</code></div>
                  <div>test: <code>{f.testHint}</code></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details open={prOpen} onToggle={(e) => setPrOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer text-sm font-medium select-none">
          🧾 PR preview (advisory)
        </summary>
        <pre className="mt-2 whitespace-pre-wrap text-xs rounded bg-muted p-3 overflow-x-auto max-h-72">
          {item.pr.body}
        </pre>
        <div className="mt-2 flex flex-wrap gap-1">
          {item.pr.labels.map((l) => (
            <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>
          ))}
        </div>
      </details>
    </Card>
  );
}
