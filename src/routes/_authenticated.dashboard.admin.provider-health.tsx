import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Zap } from "lucide-react";
import {
  getProviderHealthMetrics,
  runProviderHealthCheck,
} from "@/lib/provider-health.functions";
import {
  listEmbeddingQueue,
  requeueEmbeddingItems,
  requeueDeadLetters,
  getEmbeddingAlerts,
} from "@/lib/rag-observability.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/provider-health")({
  component: ProviderHealthDashboard,
});

type Tab = "providers" | "queue";

function ProviderHealthDashboard() {
  const [tab, setTab] = useState<Tab>("providers");
  const [hours, setHours] = useState(24);
  const fetchMetrics = useServerFn(getProviderHealthMetrics);
  const runCheck = useServerFn(runProviderHealthCheck);

  const metrics = useQuery({
    queryKey: ["provider-health-metrics", hours],
    queryFn: () => fetchMetrics({ data: { hours } }),
    enabled: tab === "providers",
  });

  const ping = useMutation({
    mutationFn: () => runCheck({ data: undefined as any }),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Provider health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live status, telemetry, and circuit state for AI providers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="px-3 py-1.5 rounded-md border border-border bg-surface text-sm"
          >
            <option value={1}>Last 1h</option>
            <option value={6}>Last 6h</option>
            <option value={24}>Last 24h</option>
            <option value={168}>Last 7d</option>
          </select>
          <button
            onClick={() => ping.mutate()}
            disabled={ping.isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${ping.isPending ? "animate-spin" : ""}`} />
            Run health check
          </button>
        </div>
      </header>

      {/* Live ping results */}
      <section className="p-5 rounded-xl border border-border bg-surface">
        <h2 className="text-sm font-medium text-ink mb-3">Live ping</h2>
        {ping.isPending && <div className="text-sm text-muted-foreground">Pinging providers…</div>}
        {ping.error && <div className="text-sm text-destructive">{(ping.error as Error).message}</div>}
        {ping.data && (
          <div className="overflow-x-auto">
            <table className="text-sm w-full">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left py-1.5">Provider</th>
                  <th className="text-left py-1.5">Model</th>
                  <th className="text-left py-1.5">Status</th>
                  <th className="text-right py-1.5">Latency</th>
                  <th className="text-left py-1.5 pl-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {ping.data.results.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1.5">{r.provider}</td>
                    <td className="py-1.5">{r.model}</td>
                    <td className="py-1.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-1.5 text-right">{r.latency_ms} ms</td>
                    <td className="py-1.5 pl-3 text-xs text-muted-foreground truncate max-w-md">
                      {r.error ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-muted-foreground mt-2">
              Checked at {new Date(ping.data.checked_at).toLocaleString()}
            </div>
          </div>
        )}
        {!ping.data && !ping.isPending && (
          <div className="text-xs text-muted-foreground">
            Click "Run health check" to ping all configured providers.
          </div>
        )}
      </section>

      {/* Aggregate telemetry */}
      {metrics.isLoading && <div className="text-sm text-muted-foreground">Loading metrics…</div>}
      {metrics.error && (
        <div className="text-sm text-destructive">{(metrics.error as Error).message}</div>
      )}
      {metrics.data && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={Activity} label="Requests" value={metrics.data.totals.requests} />
            <Stat icon={CheckCircle2} label="Successes" value={metrics.data.totals.success} />
            <Stat
              icon={AlertTriangle}
              label="Failures"
              value={metrics.data.totals.failure}
              tone="danger"
            />
            <Stat icon={Zap} label="Cost (USD)" value={`$${metrics.data.totals.cost_usd}`} />
          </div>

          <section className="p-5 rounded-xl border border-border bg-surface">
            <h2 className="text-sm font-medium text-ink mb-3">Provider × model</h2>
            <div className="overflow-x-auto">
              <table className="text-sm w-full">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left py-1.5">Provider</th>
                    <th className="text-left py-1.5">Model</th>
                    <th className="text-right py-1.5">Reqs</th>
                    <th className="text-right py-1.5">Success</th>
                    <th className="text-right py-1.5">Fallback</th>
                    <th className="text-right py-1.5">Errors</th>
                    <th className="text-right py-1.5">Avg latency</th>
                    <th className="text-right py-1.5">Cost</th>
                    <th className="text-left py-1.5 pl-3">Last success</th>
                    <th className="text-left py-1.5">Last failure</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.data.providers.map((p, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1.5">{p.provider}</td>
                      <td className="py-1.5 text-xs">{p.model}</td>
                      <td className="py-1.5 text-right">{p.requests}</td>
                      <td className="py-1.5 text-right">{pct(p.success_rate)}</td>
                      <td className="py-1.5 text-right">{pct(p.fallback_rate)}</td>
                      <td className="py-1.5 text-right">{pct(p.error_rate)}</td>
                      <td className="py-1.5 text-right">{p.avg_latency_ms} ms</td>
                      <td className="py-1.5 text-right">${p.cost_usd.toFixed(4)}</td>
                      <td className="py-1.5 pl-3 text-xs text-muted-foreground">
                        {p.last_success ? new Date(p.last_success).toLocaleString() : "—"}
                      </td>
                      <td className="py-1.5 text-xs text-muted-foreground">
                        {p.last_failure ? new Date(p.last_failure).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {metrics.data.providers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-4 text-center text-muted-foreground">
                        No telemetry in window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function StatusBadge({ status }: { status: number | "NO_KEY" | "ERROR" }) {
  const ok = typeof status === "number" && status >= 200 && status < 300;
  const cls = ok
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
    : status === "NO_KEY"
      ? "bg-muted text-muted-foreground border-border"
      : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs ${cls}`}>{String(status)}</span>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: number | string;
  tone?: "warn" | "danger";
}) {
  const toneClass =
    tone === "danger" ? "text-destructive" : tone === "warn" ? "text-academy" : "text-primary";
  return (
    <div className="p-4 rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <Icon className={`size-4 ${toneClass}`} />
      </div>
      <div className="mt-2 font-display text-2xl text-ink">{value}</div>
    </div>
  );
}
