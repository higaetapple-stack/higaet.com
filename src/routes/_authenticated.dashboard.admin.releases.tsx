import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminReleaseReport, adminSreReport } from "@/lib/releases.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard/admin/releases")({
  component: ReleaseDashboard,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

function fmtDelta(n: number, suffix = "") {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}${suffix}`;
}

function deltaTone(n: number, goodDirection: "up" | "down") {
  if (n === 0) return "text-muted-foreground";
  const good = goodDirection === "up" ? n > 0 : n < 0;
  return good ? "text-emerald-600" : "text-destructive";
}

function ReleaseDashboard() {
  const [releaseId, setReleaseId] = useState("latest");
  const [pendingId, setPendingId] = useState("latest");
  const reportFn = useServerFn(adminReleaseReport);
  const sreFn = useServerFn(adminSreReport);

  const report = useQuery({
    queryKey: ["releases", "report", releaseId],
    queryFn: () => reportFn({ data: { releaseId } }),
  });
  const sre = useQuery({
    queryKey: ["releases", "sre", releaseId],
    queryFn: () => sreFn({ data: { releaseId } }),
  });

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Release Intelligence Center</h1>
        <p className="text-sm text-muted-foreground">
          Compare a 24h baseline vs a 24h post-release window across
          reliability, product, business, and performance signals.
        </p>
      </header>

      <form
        className="flex items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setReleaseId(pendingId.trim() || "latest");
        }}
      >
        <div className="flex-1 max-w-sm">
          <Label htmlFor="release-id">Release ID</Label>
          <Input
            id="release-id"
            value={pendingId}
            onChange={(e) => setPendingId(e.target.value)}
            placeholder="rc-2026-01-15"
          />
        </div>
        <Button type="submit" disabled={report.isFetching}>
          {report.isFetching ? "Loading…" : "Analyze"}
        </Button>
      </form>

      {report.isLoading && <div>Loading release report…</div>}
      {report.error && (
        <div className="text-sm text-destructive">
          {(report.error as Error).message}
        </div>
      )}

      {report.data && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Impact Score — {report.data.releaseId}</CardTitle>
              <Badge
                variant={
                  report.data.score.label === "regression"
                    ? "destructive"
                    : report.data.score.label === "high improvement"
                      ? "default"
                      : "secondary"
                }
              >
                {report.data.score.label}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold">
                {report.data.score.score}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Weighted across payments, signup, reliability, revenue, and
                Lighthouse.
              </p>
            </CardContent>
          </Card>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DeltaCard
              label="Error rate"
              value={fmtDelta(report.data.delta.errorDelta, "%")}
              tone={deltaTone(report.data.delta.errorDelta, "down")}
            />
            <DeltaCard
              label="Crashes"
              value={fmtDelta(report.data.delta.crashDelta)}
              tone={deltaTone(report.data.delta.crashDelta, "down")}
            />
            <DeltaCard
              label="Signup conversion"
              value={fmtDelta(report.data.delta.signupDelta, "%")}
              tone={deltaTone(report.data.delta.signupDelta, "up")}
            />
            <DeltaCard
              label="Payment success"
              value={fmtDelta(report.data.delta.paymentDelta, "%")}
              tone={deltaTone(report.data.delta.paymentDelta, "up")}
            />
            <DeltaCard
              label="Revenue"
              value={fmtDelta(report.data.delta.revenueDelta)}
              tone={deltaTone(report.data.delta.revenueDelta, "up")}
            />
            <DeltaCard
              label="Lighthouse"
              value={fmtDelta(report.data.delta.lighthouseDelta)}
              tone={deltaTone(report.data.delta.lighthouseDelta, "up")}
            />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {report.data.insights.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snapshots</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <SnapshotBlock title="Before (24h baseline)" snap={report.data.before} />
              <SnapshotBlock title="After (24h post-release)" snap={report.data.after} />
            </CardContent>
          </Card>

          {sre.data && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>AI SRE Decision</CardTitle>
                <Badge
                  variant={
                    sre.data.analysis.decision === "ROLLBACK_RECOMMENDED"
                      ? "destructive"
                      : sre.data.analysis.decision === "WARN"
                        ? "secondary"
                        : "default"
                  }
                >
                  {sre.data.analysis.decision}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="font-medium">Reasons</div>
                  <ul className="list-disc pl-5">
                    {sre.data.analysis.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Rollback signal</div>
                  <p className="text-muted-foreground">
                    {sre.data.signal.action} — signals only, no automatic deploy.
                  </p>
                </div>
                <div>
                  <div className="font-medium">Predictive gate (next release)</div>
                  <p>
                    Risk: <span className="font-mono">{sre.data.predictive.riskLevel}</span> —{" "}
                    {sre.data.predictive.allowDeploy ? "deploy allowed" : "deploy blocked"}
                  </p>
                  {sre.data.predictive.warnings.length > 0 && (
                    <ul className="list-disc pl-5 mt-1">
                      {sre.data.predictive.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="font-medium">Auto-fix plan</div>
                  {sre.data.fixPlan.patches.length === 0 ? (
                    <p className="text-muted-foreground">No fixes suggested.</p>
                  ) : (
                    <ul className="list-disc pl-5">
                      {sre.data.fixPlan.patches.map((p, i) => (
                        <li key={i}>
                          <span className="font-mono">{p.file}</span> — {p.change}
                          {p.needsManualReview && (
                            <Badge variant="outline" className="ml-2">manual review</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <details>
                  <summary className="cursor-pointer font-medium">Alert preview</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted p-3 rounded">
{sre.data.alert.body}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}
        </>

      )}
    </div>
  );
}

function DeltaCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${tone}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function SnapshotBlock({
  title,
  snap,
}: {
  title: string;
  snap: {
    errorRate: number;
    crashCount: number;
    signupConversion: number;
    paymentSuccessRate: number;
    revenue: number;
    lighthouseScore: number;
    timestamp: number;
  };
}) {
  return (
    <div>
      <div className="font-medium mb-2">{title}</div>
      <dl className="grid grid-cols-2 gap-y-1">
        <dt className="text-muted-foreground">Error rate</dt>
        <dd>{snap.errorRate}%</dd>
        <dt className="text-muted-foreground">Crashes</dt>
        <dd>{snap.crashCount}</dd>
        <dt className="text-muted-foreground">Signup conv.</dt>
        <dd>{snap.signupConversion}%</dd>
        <dt className="text-muted-foreground">Payment success</dt>
        <dd>{snap.paymentSuccessRate}%</dd>
        <dt className="text-muted-foreground">Revenue</dt>
        <dd>{snap.revenue}</dd>
        <dt className="text-muted-foreground">Lighthouse</dt>
        <dd>{snap.lighthouseScore}</dd>
        <dt className="text-muted-foreground">Window end</dt>
        <dd>{new Date(snap.timestamp).toLocaleString()}</dd>
      </dl>
    </div>
  );
}
