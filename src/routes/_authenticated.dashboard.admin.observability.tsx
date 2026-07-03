import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminBusinessKpis,
  adminListSystemErrors,
  adminListSystemMetrics,
  adminObservabilitySummary,
  type BusinessKpis,
  type ObservabilitySummary,
} from "@/lib/observability.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute(
  "/_authenticated/dashboard/admin/observability",
)({
  component: ObservabilityPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

function fmt(n: number | null | undefined, suffix = "") {
  if (n === null || n === undefined) return "—";
  return `${Math.round(n)}${suffix}`;
}

function ObservabilityPage() {
  const [hours, setHours] = useState(24);
  const [errSource, setErrSource] = useState<string>("all");
  const [errLevel, setErrLevel] = useState<string>("all");

  const summaryFn = useServerFn(adminObservabilitySummary);
  const errorsFn = useServerFn(adminListSystemErrors);
  const metricsFn = useServerFn(adminListSystemMetrics);

  const summary = useQuery({
    queryKey: ["observability", "summary", hours],
    queryFn: () => summaryFn({ data: { hours } }),
  });

  const errors = useQuery({
    queryKey: ["observability", "errors", errSource, errLevel],
    queryFn: () =>
      errorsFn({
        data: {
          limit: 50,
          source: errSource === "all" ? undefined : (errSource as never),
          level: errLevel === "all" ? undefined : (errLevel as never),
        },
      }),
  });

  const metrics = useQuery({
    queryKey: ["observability", "metrics"],
    queryFn: () => metricsFn({ data: { limit: 100 } }),
  });

  const s = summary.data as ObservabilitySummary | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">
            Observability
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Errors, performance, and notification health across the HIGAET platform.
          </p>
        </div>
        <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 1 hour</SelectItem>
            <SelectItem value="24">Last 24 hours</SelectItem>
            <SelectItem value="168">Last 7 days</SelectItem>
            <SelectItem value="720">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Errors" value={fmt(s?.errors_total)} />
        <StatCard label="p95 route" value={fmt(s?.perf_p95_route_ms, " ms")} />
        <StatCard
          label="p95 server fn"
          value={fmt(s?.perf_p95_server_fn_ms, " ms")}
        />
        <StatCard
          label="Notifications failed"
          value={fmt(s?.notifications_failed)}
          tone={(s?.notifications_failed ?? 0) > 0 ? "warn" : "ok"}
        />
      </div>

      <Tabs defaultValue="errors">
        <TabsList>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security events</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Select value={errSource} onValueChange={setErrSource}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="client">client</SelectItem>
                <SelectItem value="server_fn">server_fn</SelectItem>
                <SelectItem value="api_route">api_route</SelectItem>
                <SelectItem value="background">background</SelectItem>
                <SelectItem value="realtime">realtime</SelectItem>
                <SelectItem value="auth">auth</SelectItem>
              </SelectContent>
            </Select>
            <Select value={errLevel} onValueChange={setErrLevel}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="warning">warning</SelectItem>
                <SelectItem value="error">error</SelectItem>
                <SelectItem value="fatal">fatal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {errors.isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading…</div>
              ) : (errors.data ?? []).length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No errors recorded.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {(errors.data ?? []).map((e) => (
                    <li key={e.id} className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={e.level === "fatal" ? "destructive" : "secondary"}>
                          {e.level}
                        </Badge>
                        <Badge variant="outline">{e.source}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(e.occurred_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="font-mono text-sm text-ink truncate">{e.message}</div>
                      {e.route ? (
                        <div className="text-xs text-muted-foreground mt-0.5">{e.route}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {s?.top_fingerprints && s.top_fingerprints.length > 0 ? (
            <Card>
              <CardHeader><CardTitle className="text-sm">Top recurring errors</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {s.top_fingerprints.map((f) => (
                    <li key={f.fingerprint} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs text-ink truncate">{f.sample_message}</div>
                        <div className="text-xs text-muted-foreground">
                          last seen {new Date(f.last_seen).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="secondary">{f.occurrences}×</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {metrics.isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading…</div>
              ) : (metrics.data ?? []).length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No metrics recorded.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">When</th>
                      <th className="text-left p-3">Kind</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-right p-3">Duration</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(metrics.data ?? []).map((m) => (
                      <tr key={m.id} className="border-t border-border">
                        <td className="p-3 text-xs text-muted-foreground">{new Date(m.recorded_at).toLocaleTimeString()}</td>
                        <td className="p-3"><Badge variant="outline">{m.kind}</Badge></td>
                        <td className="p-3 font-mono text-xs">{m.name}</td>
                        <td className="p-3 text-right tabular-nums">{m.duration_ms} ms</td>
                        <td className="p-3 text-xs">{m.status ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              {s?.security_events_total ?? 0} security event(s) in the selected window.
              See <a className="underline" href="/dashboard/security">Security</a> for the per-user audit feed.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Delivered</div>
                  <div className="text-2xl font-medium text-ink tabular-nums">{s?.notifications_delivered ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                  <div className="text-2xl font-medium text-destructive tabular-nums">{s?.notifications_failed ?? 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={
            tone === "warn"
              ? "text-2xl font-medium text-destructive tabular-nums mt-1"
              : "text-2xl font-medium text-ink tabular-nums mt-1"
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
