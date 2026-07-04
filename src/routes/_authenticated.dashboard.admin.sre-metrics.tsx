import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminGetSreMetrics,
  type SREMetricsPayload,
} from "@/lib/sre-metrics.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, RefreshCw, Sigma, ShieldCheck } from "lucide-react";

const metricsQuery = () =>
  queryOptions({
    queryKey: ["admin", "sre-metrics"],
    queryFn: () => adminGetSreMetrics() as Promise<SREMetricsPayload>,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export const Route = createFileRoute("/_authenticated/dashboard/admin/sre-metrics")({
  head: () => ({
    meta: [
      { title: "AI SRE Metrics — Calibration" },
      { name: "description", content: "MAE, drift, calibration state and replay simulation for the AI SRE model." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(metricsQuery()),
  component: SREMetricsPage,
  errorComponent: ({ error }) => (
    <div className="p-6">
      <Card className="p-5 border-destructive/40">
        <h1 className="font-semibold text-destructive mb-2">Could not load SRE metrics</h1>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </Card>
    </div>
  ),
});

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </Card>
  );
}

function Sparkline({ points }: { points: Array<{ t: number; abs: number }> }) {
  if (points.length < 2) return <p className="text-xs text-muted-foreground">Not enough samples yet.</p>;
  const w = 400;
  const h = 60;
  const max = Math.max(...points.map((p) => p.abs), 1);
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (p.abs / max) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-primary" />
    </svg>
  );
}

function SREMetricsPage() {
  const { data } = useSuspenseQuery(metricsQuery());
  const qc = useQueryClient();
  const refetch = useServerFn(adminGetSreMetrics);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const fresh = await refetch();
      qc.setQueryData(["admin", "sre-metrics"], fresh);
    } finally {
      setRefreshing(false);
    }
  }

  const stateBadge =
    data.calibration.state === "ACTIVE"
      ? "default"
      : data.calibration.state === "FROZEN"
        ? "secondary"
        : "destructive";

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">AI SRE Metrics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calibration, drift and simulation preview. Advisory only.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Samples" value={String(data.accuracy.count)} />
        <Metric
          label="Rolling MAE"
          value={data.rollingMae.toFixed(2)}
          hint={`trend: ${data.accuracy.trend}`}
        />
        <Metric
          label="Over-prediction"
          value={`${(data.accuracy.overPredictionRate * 100).toFixed(0)}%`}
        />
        <Metric
          label="Under-prediction"
          value={`${(data.accuracy.underPredictionRate * 100).toFixed(0)}%`}
        />
      </section>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-medium">|Δ| over time</h2>
          </div>
          <span className="text-xs text-muted-foreground">{data.timeseries.length} samples</span>
        </div>
        <Sparkline points={data.timeseries} />
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sigma className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-medium">Calibration</h2>
          </div>
          <Badge variant={stateBadge}>{data.calibration.state}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{data.calibration.reason}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Cycle</p>
            <p className="font-medium">{data.calibration.cycle}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Drift</p>
            <p className="font-medium">{data.calibration.drift.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Worsening streak</p>
            <p className="font-medium">{data.calibration.worseningStreak}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Capped</p>
            <p className="font-medium">{data.calibration.cappedAdjustment ? "Yes" : "No"}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current thresholds</p>
            <code className="text-xs">
              M={data.currentThresholds.medium.toFixed(1)} · H=
              {data.currentThresholds.high.toFixed(1)} · C=
              {data.currentThresholds.critical.toFixed(1)}
            </code>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Proposed</p>
            <code className="text-xs">
              M={data.calibration.proposed.medium.toFixed(1)} · H=
              {data.calibration.proposed.high.toFixed(1)} · C=
              {data.calibration.proposed.critical.toFixed(1)}
            </code>
          </div>
        </div>
      </Card>

      {data.alerts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="font-medium">Drift alerts</h2>
          </div>
          <ul className="space-y-2">
            {data.alerts.map((a) => (
              <li key={a.id} className="border rounded-md p-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      a.severity === "critical"
                        ? "destructive"
                        : a.severity === "warning"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {a.severity}
                  </Badge>
                  <span className="font-medium text-sm">{a.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">score {a.score}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                {a.affectedServices.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    services: {a.affectedServices.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium">Replay simulation (proposed thresholds)</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Metric label="Cases" value={String(data.simulationPreview.cases)} />
          <Metric label="Changed" value={String(data.simulationPreview.changed)} />
          <Metric
            label="Correct escalations"
            value={String(data.simulationPreview.correctlyEscalated)}
          />
          <Metric
            label="Incorrect relax"
            value={String(data.simulationPreview.incorrectlyRelaxed)}
          />
        </div>
        {data.simulationPreview.rows.length > 0 && (
          <div className="mt-4 max-h-64 overflow-auto text-xs">
            <table className="w-full">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="text-left py-1">PR</th>
                  <th className="text-left">Score</th>
                  <th className="text-left">Original</th>
                  <th className="text-left">Simulated</th>
                  <th className="text-left">Δ</th>
                  <th className="text-left">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {data.simulationPreview.rows.slice(-20).map((r) => (
                  <tr key={r.prNumber} className="border-t">
                    <td className="py-1">#{r.prNumber}</td>
                    <td>{r.score.toFixed(0)}</td>
                    <td>{r.original}</td>
                    <td>{r.simulated}</td>
                    <td>{r.delta}</td>
                    <td>{r.actualOutcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
