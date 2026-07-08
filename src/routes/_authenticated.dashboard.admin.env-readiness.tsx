import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  History,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getEnvReadiness,
  getEnvReadinessActivity,
  recheckEnvReadinessNow,
  type EnvReadinessReport,
  type SecretCheck,
} from "@/lib/env-readiness.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/env-readiness")({
  component: EnvReadinessPage,
});

const OVERALL_LABEL: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  ready: { label: "Ready", className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30", Icon: CheckCircle2 },
  degraded: { label: "Degraded", className: "bg-amber-500/10 text-amber-700 ring-amber-500/30", Icon: AlertTriangle },
  blocked: { label: "Blocked", className: "bg-rose-500/10 text-rose-700 ring-rose-500/30", Icon: XCircle },
};

function StatusPill({ check }: { check: SecretCheck }) {
  if (check.status === "present") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
        <CheckCircle2 className="mr-1 size-3" /> Present
      </Badge>
    );
  }
  if (check.status === "malformed") {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
        <AlertTriangle className="mr-1 size-3" /> Malformed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700">
      <XCircle className="mr-1 size-3" /> Missing
    </Badge>
  );
}

function downloadReport(report: EnvReadinessReport) {
  const payload = {
    kind: "higaet.env-readiness.report",
    version: 1,
    exportedAt: new Date().toISOString(),
    ...report,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `env-readiness-${report.overall}-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function EnvReadinessPage() {
  const fetchReport = useServerFn(getEnvReadiness);
  const fetchActivity = useServerFn(getEnvReadinessActivity);
  const forceRecheck = useServerFn(recheckEnvReadinessNow);
  const qc = useQueryClient();

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin", "env-readiness"],
    queryFn: () => fetchReport(),
    refetchOnWindowFocus: false,
    // Cached snapshot refreshes every 15 minutes via cron; poll every 60s so the
    // dashboard picks it up without hammering the server.
    refetchInterval: 60_000,
  });

  const activityQuery = useQuery({
    queryKey: ["admin", "env-readiness", "activity"],
    queryFn: () => fetchActivity(),
    refetchOnWindowFocus: false,
    refetchInterval: 60_000,
  });

  const recheckMutation = useMutation({
    mutationFn: () => forceRecheck(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "env-readiness"] });
    },
  });

  if (isError) {
    const msg = error instanceof Error ? error.message : "Failed to load";
    return (
      <div className="p-6">
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="size-5" />
              {msg === "Forbidden" ? "Admin access required" : "Unable to load readiness"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {msg === "Forbidden"
              ? "You need the admin or super_admin role to view environment readiness."
              : msg}
          </CardContent>
        </Card>
      </div>
    );
  }

  const overall = data?.overall ?? "ready";
  const ov = OVERALL_LABEL[overall];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Environment Readiness</h1>
          <p className="text-sm text-muted-foreground">
            Presence-only audit of production runtime secrets. Values are never returned to the browser.
            Snapshot refreshed automatically every 15 minutes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => data && downloadReport(data)}
            disabled={!data}
          >
            <Download className="mr-2 size-4" />
            Download report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => recheckMutation.mutate()}
            disabled={recheckMutation.isPending || isFetching}
          >
            <RefreshCw
              className={`mr-2 size-4 ${
                recheckMutation.isPending || isFetching ? "animate-spin" : ""
              }`}
            />
            Recheck now
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading readiness…</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className={`ring-1 ring-inset ${ov.className}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-lg font-semibold">
                <ov.Icon className="size-5" />
                {ov.label}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-emerald-600">
                {data.totals.present}/{data.totals.checked}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Missing</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-rose-600">
                {data.totals.missing}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Blocking Missing</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-rose-700">
                {data.totals.blockingMissing}
              </CardContent>
            </Card>
          </div>

          {(() => {
            const issues = data.groups.flatMap((g) =>
              g.checks
                .filter((c) => c.status !== "present")
                .map((c) => ({ ...c, category: g.category })),
            );
            if (issues.length === 0) {
              return (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700 text-base">
                      <CheckCircle2 className="size-5" /> No issues detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    All configured secrets are present and well-formed.
                  </CardContent>
                </Card>
              );
            }
            const blocking = issues.filter((i) => i.blocking);
            const nonBlocking = issues.filter((i) => !i.blocking);
            return (
              <Card className="border-rose-500/30 bg-rose-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rose-700 text-base">
                    <ShieldAlert className="size-5" />
                    {issues.length} issue{issues.length === 1 ? "" : "s"} detected
                    {blocking.length > 0 ? (
                      <Badge variant="destructive" className="ml-2">
                        {blocking.length} blocking
                      </Badge>
                    ) : null}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Secret names only — values are never sent to the browser.
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Secret</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Problem</TableHead>
                        <TableHead>Blocking</TableHead>
                        <TableHead>Fix</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...blocking, ...nonBlocking].map((i) => (
                        <TableRow key={`${i.category}:${i.name}`}>
                          <TableCell className="font-mono text-xs">{i.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {i.category}
                          </TableCell>
                          <TableCell>
                            <StatusPill check={i} />
                          </TableCell>
                          <TableCell>
                            {i.blocking ? (
                              <Badge variant="destructive">Blocking</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">no</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {i.detail ? (
                              <span className="text-amber-700">{i.detail}. </span>
                            ) : null}
                            {i.hint ??
                              (i.status === "missing"
                                ? "Set this secret in Lovable Cloud."
                                : "Reformat and re-save this secret.")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })()}

          {data.groups.map((g) => (
            <Card key={g.category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{g.category}</span>
                  <Badge variant={g.required ? "default" : "secondary"}>
                    {g.required ? "Required" : "Optional"}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{g.description}</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Secret</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Blocking</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.checks.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell className="font-mono text-xs">{c.name}</TableCell>
                        <TableCell>
                          <StatusPill check={c} />
                        </TableCell>
                        <TableCell>
                          {c.blocking ? (
                            <Badge variant="destructive">Blocking</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">no</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.detail ? <span className="text-amber-700">{c.detail}. </span> : null}
                          {c.hint ?? (c.status === "present" ? "OK" : "")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-4" />
                Activity log
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Latest 50 events. Views and verdict changes only — no secret values.
              </p>
            </CardHeader>
            <CardContent>
              {activityQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading activity…</p>
              ) : (activityQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Previous</TableHead>
                      <TableHead>Next</TableHead>
                      <TableHead>Actor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activityQuery.data ?? []).map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={e.event_type === "state_changed" ? "destructive" : "secondary"}
                          >
                            {e.event_type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{e.previous_overall ?? "—"}</TableCell>
                        <TableCell className="text-xs">{e.next_overall ?? "—"}</TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {e.user_id ? e.user_id.slice(0, 8) : "system"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Snapshot from {data.cachedAt ? new Date(data.cachedAt).toLocaleString() : "just now"}
            {data.source ? ` · source: ${data.source}` : ""} · env {data.environment}
          </p>
        </>
      )}
    </div>
  );
}
