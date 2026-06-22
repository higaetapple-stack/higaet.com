import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { systemHealthSummary, type SystemHealth } from "@/lib/system-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/admin/system")({
  component: SystemHealthPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
});

const STATUS_STYLES: Record<string, string> = {
  healthy: "bg-emerald-100 text-emerald-800",
  degraded: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
};

function Metric({ label, value, hint, danger }: { label: string; value: React.ReactNode; hint?: string; danger?: boolean }) {
  return (
    <div className="rounded-lg ring-1 ring-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-medium mt-1 ${danger ? "text-red-600" : "text-ink"}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function SystemHealthPage() {
  const fn = useServerFn(systemHealthSummary);
  const q = useQuery({
    queryKey: ["system-health"],
    queryFn: () => fn(),
    refetchInterval: 30000,
  });
  const d = q.data as SystemHealth | undefined;

  return (
    <div className="max-w-7xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">Launch dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Production readiness — system health across notifications, webhooks, RAG, AI, API, and errors.
          </p>
        </div>
        {d && (
          <Badge className={STATUS_STYLES[d.status]}>
            {d.status.toUpperCase()}
          </Badge>
        )}
      </header>

      {q.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {q.error && <div className="text-sm text-destructive">{(q.error as Error).message}</div>}

      {d && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Errors (24h)" value={d.errors.total_24h} danger={d.errors.total_24h > 100} />
            <Metric label="Critical errors (24h)" value={d.errors.critical_24h} danger={d.errors.critical_24h > 0} />
            <Metric label="Security events (24h)" value={d.security_events_24h} />
            <Metric label="Active API keys" value={d.api.active_keys} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <Metric label="Delivered 24h" value={d.notifications.delivered_24h} />
                <Metric label="Failed 24h" value={d.notifications.failed_24h} danger={d.notifications.failed_24h > 0} />
                <Metric label="Pending" value={d.notifications.pending} />
                <Metric label="Failure rate" value={`${d.notifications.failure_rate}%`} danger={d.notifications.failure_rate > 5} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Webhooks</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <Metric label="Subscriptions" value={d.webhooks.subscriptions} />
                <Metric label="Delivered 24h" value={d.webhooks.delivered_24h} />
                <Metric label="Failed 24h" value={d.webhooks.failed_24h} danger={d.webhooks.failed_24h > 0} />
                <Metric label="Pending" value={d.webhooks.pending} />
                <Metric label="Failure rate" value={`${d.webhooks.failure_rate}%`} danger={d.webhooks.failure_rate > 5} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">RAG / Embeddings</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Metric label="Embedded documents" value={d.rag.embedded_docs} />
                <Metric label="Queue pending" value={d.rag.queue_pending} />
                <Metric label="Queue failed" value={d.rag.queue_failed} danger={d.rag.queue_failed > 10} />
                <Metric label="Dead letters" value={d.rag.queue_dead} danger={d.rag.queue_dead > 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">AI Usage (24h)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <Metric label="Conversations" value={d.ai.conversations_24h} />
                <Metric label="Messages" value={d.ai.messages_24h} />
                <Metric label="Total conversations" value={d.ai.total_conversations} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">API Platform (24h)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <Metric label="Requests" value={d.api.requests_24h} />
                <Metric label="Errors" value={d.api.error_requests_24h} danger={d.api.error_requests_24h > 0} />
                <Metric label="Error rate" value={`${d.api.error_rate}%`} danger={d.api.error_rate > 2} />
              </CardContent>
            </Card>

            {d.observability && (
              <Card>
                <CardHeader><CardTitle className="text-base">Performance (p95, ms)</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Metric label="Routes" value={Math.round(d.observability.perf_p95_route_ms ?? 0)} />
                  <Metric label="Server fns" value={Math.round(d.observability.perf_p95_server_fn_ms ?? 0)} />
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Drill-downs</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm">
              <Link to="/dashboard/admin/observability" className="px-3 py-1.5 rounded ring-1 ring-border hover:bg-muted">Observability</Link>
              <Link to="/dashboard/admin/notifications" className="px-3 py-1.5 rounded ring-1 ring-border hover:bg-muted">Notifications</Link>
              <Link to="/dashboard/admin/webhooks" className="px-3 py-1.5 rounded ring-1 ring-border hover:bg-muted">Webhooks</Link>
              <Link to="/dashboard/admin/rag" className="px-3 py-1.5 rounded ring-1 ring-border hover:bg-muted">RAG</Link>
              <Link to="/dashboard/admin/api" className="px-3 py-1.5 rounded ring-1 ring-border hover:bg-muted">API keys</Link>
              <Link to="/dashboard/admin/ai/usage" className="px-3 py-1.5 rounded ring-1 ring-border hover:bg-muted">AI usage</Link>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            Snapshot at {new Date(d.generated_at).toLocaleString()} · 24h window · auto-refresh 30s
          </div>
        </>
      )}
    </div>
  );
}
