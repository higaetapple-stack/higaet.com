import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import {
  getLiveControllerState,
  getOpenIncidents,
  getAuditRows,
  getAuditTrends,
  getGovernanceState,
  getBrevoReliability,
  getIngestFailures,
  type AuditRow,
  type IncidentRow,
  type TrendPoint,
  type IngestFailureRow,
} from "@/lib/ops-reliability.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const SearchSchema = z.object({
  range: z.enum(["24h", "7d", "30d"]).default("7d").catch("7d"),
});

export const Route = createFileRoute("/_authenticated/ops/reliability")({
  validateSearch: zodValidator(SearchSchema),
  head: () => ({
    meta: [{ title: "Reliability Operations — HIGAET" }],
  }),
  component: ReliabilityDashboard,
});

type Range = "24h" | "7d" | "30d";

function statusVariant(
  state: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  switch (state) {
    case "HEALTHY":
      return "default";
    case "STABLE":
      return "secondary";
    case "DEGRADED":
      return "outline";
    case "CRITICAL":
    case "UNSTABLE":
      return "destructive";
    default:
      return "outline";
  }
}

function severityVariant(
  sev: IncidentRow["severity"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (sev) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "outline";
    case "LOW":
    default:
      return "secondary";
  }
}

function ReliabilityDashboard() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const range = search.range as Range;

  const fetchController = useServerFn(getLiveControllerState);
  const fetchIncidents = useServerFn(getOpenIncidents);
  const fetchAudit = useServerFn(getAuditRows);
  const fetchTrends = useServerFn(getAuditTrends);
  const fetchGov = useServerFn(getGovernanceState);
  const fetchBrevo = useServerFn(getBrevoReliability);

  const controllerQ = useQuery({
    queryKey: ["ops", "controller"],
    queryFn: () => fetchController(),
    refetchInterval: 60_000,
  });
  const incidentsQ = useQuery({
    queryKey: ["ops", "incidents"],
    queryFn: () => fetchIncidents(),
    refetchInterval: 60_000,
  });
  const auditQ = useQuery({
    queryKey: ["ops", "audit", range],
    queryFn: () => fetchAudit({ data: { range } }),
  });
  const trendsQ = useQuery({
    queryKey: ["ops", "trends", range],
    queryFn: () => fetchTrends({ data: { range } }),
  });
  const govQ = useQuery({
    queryKey: ["ops", "governance"],
    queryFn: () => fetchGov(),
    refetchInterval: 120_000,
  });
  const brevoQ = useQuery({
    queryKey: ["ops", "brevo", range],
    queryFn: () => fetchBrevo({ data: { range } }),
  });
  const fetchIngestFailures = useServerFn(getIngestFailures);
  const ingestFailuresQ = useQuery({
    queryKey: ["ops", "ingest-failures"],
    queryFn: () => fetchIngestFailures(),
    refetchInterval: 60_000,
  });

  const audit: AuditRow[] = auditQ.data ?? [];
  const latest = audit[0];

  const setRange = (r: Range) =>
    navigate({ search: (prev: { range: Range }) => ({ ...prev, range: r }) });

  return (
    <div className="space-y-6">
      {/* Range selector + refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md border border-border p-1 bg-card">
          {(["24h", "7d", "30d"] as Range[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "ghost"}
              size="sm"
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            controllerQ.refetch();
            incidentsQ.refetch();
            auditQ.refetch();
            trendsQ.refetch();
            govQ.refetch();
            brevoQ.refetch();
            ingestFailuresQ.refetch();
          }}
        >
          Refresh
        </Button>
      </div>

      {/* 8. EXECUTIVE SUMMARY */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
          <Summary label="Platform State">
            <Badge variant={statusVariant(latest?.platform_state ?? null)}>
              {latest?.platform_state ?? "—"}
            </Badge>
          </Summary>
          <Summary label="Health Score">
            <span className="font-medium text-ink">
              {latest?.system_health_score ?? "—"}
              {latest?.system_health_score != null ? "/100" : ""}
            </span>
          </Summary>
          <Summary label="Risk Level">
            <Badge variant={latest?.risk_level === "CRITICAL" || latest?.risk_level === "HIGH" ? "destructive" : "secondary"}>
              {latest?.risk_level ?? "—"}
            </Badge>
          </Summary>
          <Summary label="Open Critical">
            <span className="font-medium text-ink">
              {incidentsQ.data?.filter((i) => i.severity === "CRITICAL").length ?? 0}
            </span>
          </Summary>
          <Summary label="Last Decision">
            <Badge variant="outline">{latest?.decision ?? "—"}</Badge>
          </Summary>
          <Summary label="Autonomous Mode">
            <Badge variant={govQ.data?.autonomousMode === "DISABLED" ? "destructive" : "default"}>
              {govQ.data?.autonomousMode ?? "—"}
            </Badge>
          </Summary>
        </CardContent>
      </Card>

      {/* 1. PLATFORM HEALTH OVERVIEW */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Platform Health</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Tile title="SYSTEM_HEALTH_SCORE" value={`${latest?.system_health_score ?? "—"}`} />
          <Tile title="PLATFORM_STATE" value={latest?.platform_state ?? "—"} variant={statusVariant(latest?.platform_state)} />
          <Tile title="RISK_LEVEL" value={latest?.risk_level ?? "—"} variant={latest?.risk_level === "CRITICAL" ? "destructive" : "secondary"} />
          <Tile title="DEPLOYMENT_DECISION" value={latest?.decision ?? "—"} />
          <Tile title="EXECUTED" value={latest?.executed ? "YES" : "NO"} variant={latest?.executed ? "default" : "outline"} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. AUTONOMOUS CONTROLLER PANEL */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Autonomous Controller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Decision Source">{latest?.decision_source ?? "—"}</Row>
            <Row label="Decision Reason"><span className="text-muted-foreground">{latest?.decision_reason ?? "—"}</span></Row>
            <Row label="Execute Reason"><span className="text-muted-foreground">{latest?.execute_reason ?? "—"}</span></Row>
            <Row label="Latest Run">
              {controllerQ.data?.runUrl ? (
                <a className="text-academy underline" href={controllerQ.data.runUrl} target="_blank" rel="noreferrer">
                  {controllerQ.data.runConclusion ?? controllerQ.data.runStatus ?? "view"}
                </a>
              ) : "—"}
            </Row>
            <Row label="Recent Overrides">
              <span className="font-medium">{govQ.data?.recentOverrides.length ?? 0}</span>
            </Row>
          </CardContent>
        </Card>

        {/* 7. GOVERNANCE PANEL */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Governance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="SYSTEM_MODE">
              <Badge variant={govQ.data?.systemMode === "FREEZE" ? "destructive" : "default"}>
                {govQ.data?.systemMode ?? "—"}
              </Badge>
            </Row>
            <Row label="AUTONOMOUS_MODE">
              <Badge variant={govQ.data?.autonomousMode === "DISABLED" ? "destructive" : "default"}>
                {govQ.data?.autonomousMode ?? "—"}
              </Badge>
            </Row>
            <Row label="Last Override">
              {govQ.data?.recentOverrides[0]
                ? `${govQ.data.recentOverrides[0].decision} by ${govQ.data.recentOverrides[0].actor ?? "?"} at ${new Date(govQ.data.recentOverrides[0].ts).toLocaleString()}`
                : "—"}
            </Row>
            <Row label="Audit Log">
              {controllerQ.data?.runUrl ? (
                <a className="text-academy underline" target="_blank" rel="noreferrer" href={`${controllerQ.data.runUrl.split("/actions/")[0]}/issues?q=is%3Aissue+label%3Aaudit+label%3Acontrol-plane`}>
                  open in GitHub
                </a>
              ) : "—"}
            </Row>
          </CardContent>
        </Card>

        {/* 4. BREVO RELIABILITY */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Brevo Reliability</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Auth Success" value={`${brevoQ.data?.authSuccessRate ?? 0}%`} />
            <Stat label="Endpoint Success" value={`${brevoQ.data?.endpointSuccessRate ?? 0}%`} />
            <Stat label="Auth Failures" value={String(brevoQ.data?.authFailures ?? 0)} />
            <Stat label="Timeouts" value={String(brevoQ.data?.timeouts ?? 0)} />
            <Stat label="Runs in window" value={String(brevoQ.data?.totalRuns ?? 0)} />
            <Stat label="Last Verified" value={brevoQ.data?.lastVerifiedAt ? new Date(brevoQ.data.lastVerifiedAt).toLocaleString() : "—"} />
          </CardContent>
        </Card>

        {/* 3. INCIDENT CENTER */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Incident Center</CardTitle>
          </CardHeader>
          <CardContent>
            <IncidentList rows={incidentsQ.data ?? []} loading={incidentsQ.isLoading} />
          </CardContent>
        </Card>
      </div>

      {/* 6. RISK ANALYTICS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Risk Analytics ({range})</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <TrendChart data={trendsQ.data ?? []} />
        </CardContent>
      </Card>

      {/* 2. DEPLOYMENT TIMELINE */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Deployment Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <DeploymentTable rows={audit.slice(0, 50)} />
        </CardContent>
      </Card>

      {/* 9. CI AUDIT INGEST FAILURES (Admin diagnostics) */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">CI Audit Ingest Failures</CardTitle>
          <Button size="sm" variant="outline" onClick={() => ingestFailuresQ.refetch()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <IngestFailureTable rows={ingestFailuresQ.data ?? []} loading={ingestFailuresQ.isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Building blocks ----------

function Summary({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Tile({
  title,
  value,
  variant = "outline",
}: {
  title: string;
  value: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      <Badge variant={variant} className="text-base px-3 py-1">{value}</Badge>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-medium text-ink mt-1">{value}</div>
    </div>
  );
}

function IncidentList({ rows, loading }: { rows: IncidentRow[]; loading: boolean }) {
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!rows.length) return <div className="text-sm text-muted-foreground">No open incidents.</div>;
  const groups: Record<IncidentRow["severity"], IncidentRow[]> = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: [],
  };
  for (const r of rows) groups[r.severity].push(r);
  return (
    <Accordion type="multiple" defaultValue={["CRITICAL", "HIGH"]}>
      {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => (
        <AccordionItem key={sev} value={sev}>
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Badge variant={severityVariant(sev)}>{sev}</Badge>
              <span className="text-muted-foreground">{groups[sev].length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {groups[sev].length === 0 ? (
              <div className="text-xs text-muted-foreground py-2">None.</div>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {groups[sev].map((i) => (
                  <li key={i.number} className="flex justify-between gap-3">
                    <a className="text-academy underline truncate" href={i.url} target="_blank" rel="noreferrer">
                      #{i.number} {i.diagnosis}
                    </a>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ×{i.count} · {new Date(i.updatedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function TrendChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) {
    return <div className="text-sm text-muted-foreground">No CI data ingested yet in this window.</div>;
  }
  const formatted = data.map((p) => ({
    ...p,
    label: new Date(p.bucket).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" }),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="health" name="Health" stroke="hsl(var(--academy))" dot={false} />
        <Line type="monotone" dataKey="risk" name="Risk" stroke="hsl(var(--destructive))" dot={false} />
        <Line type="monotone" dataKey="incidents" name="Incidents" stroke="hsl(var(--ring))" dot={false} />
        <Line type="monotone" dataKey="retries" name="Retries" stroke="hsl(var(--muted-foreground))" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function DeploymentTable({ rows }: { rows: AuditRow[] }) {
  if (!rows.length) {
    return <div className="text-sm text-muted-foreground">No decisions recorded yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground uppercase">
            <th className="py-2 pr-3">Time</th>
            <th className="py-2 pr-3">SHA</th>
            <th className="py-2 pr-3">Actor</th>
            <th className="py-2 pr-3">Decision</th>
            <th className="py-2 pr-3">Executed</th>
            <th className="py-2 pr-3">Health</th>
            <th className="py-2 pr-3">Risk</th>
            <th className="py-2 pr-3">Run</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.ts).toLocaleString()}</td>
              <td className="py-2 pr-3 font-mono text-xs">{r.sha.slice(0, 7)}</td>
              <td className="py-2 pr-3">{r.actor ?? "—"}</td>
              <td className="py-2 pr-3"><Badge variant="outline">{r.decision}</Badge></td>
              <td className="py-2 pr-3">{r.executed ? "✓" : "—"}</td>
              <td className="py-2 pr-3">{r.system_health_score ?? "—"}</td>
              <td className="py-2 pr-3">{r.risk_level ?? "—"}</td>
              <td className="py-2 pr-3">
                {r.run_url ? (
                  <a className="text-academy underline" href={r.run_url} target="_blank" rel="noreferrer">view</a>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IngestFailureTable({ rows, loading }: { rows: IngestFailureRow[]; loading: boolean }) {
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!rows.length) {
    return <div className="text-sm text-muted-foreground">No ingest failures recorded.</div>;
  }
  const copy = (row: IngestFailureRow) => {
    void navigator.clipboard.writeText(JSON.stringify(row, null, 2));
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground uppercase">
            <th className="py-2 pr-3">Time</th>
            <th className="py-2 pr-3">Workflow / Job</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Reason</th>
            <th className="py-2 pr-3">Correlation</th>
            <th className="py-2 pr-3">Retries</th>
            <th className="py-2 pr-3">Response</th>
            <th className="py-2 pr-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border align-top">
              <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
              <td className="py-2 pr-3">
                <div className="font-medium">{r.workflow_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{r.job_name ?? ""}</div>
              </td>
              <td className="py-2 pr-3">
                <Badge variant={r.status_code && r.status_code >= 500 ? "destructive" : "outline"}>
                  {r.status_code ?? "—"}
                </Badge>
              </td>
              <td className="py-2 pr-3 max-w-[16rem] truncate" title={r.failure_reason ?? ""}>
                {r.failure_reason ?? "—"}
              </td>
              <td className="py-2 pr-3 font-mono text-xs">{r.correlation_id?.slice(0, 8) ?? "—"}</td>
              <td className="py-2 pr-3">{r.retry_count}</td>
              <td className="py-2 pr-3 max-w-[20rem]">
                <pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground line-clamp-3">
                  {r.response_body ?? "—"}
                </pre>
              </td>
              <td className="py-2 pr-3">
                <Button size="sm" variant="outline" onClick={() => copy(r)}>
                  Copy
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
