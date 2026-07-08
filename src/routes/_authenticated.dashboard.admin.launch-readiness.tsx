import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  GitCommit,
  HardDrive,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLatestReadiness,
  listReadinessHistory,
} from "@/lib/launch-readiness.functions";
import type {
  AuditBreakdown,
  ArtifactUrls,
  LaunchReadinessRun,
  OverallStatus,
} from "@/lib/launch-readiness.types";
import { EnvReadinessBanner } from "@/components/admin/EnvReadinessBanner";


export const Route = createFileRoute(
  "/_authenticated/dashboard/admin/launch-readiness",
)({
  component: LaunchReadinessPage,
});

const STATUS_COLORS: Record<OverallStatus, string> = {
  passed: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  failed: "bg-rose-500/10 text-rose-700 ring-rose-500/20",
  unknown: "bg-muted text-muted-foreground ring-border",
};

function StatusBadge({ status }: { status: OverallStatus }) {
  const Icon =
    status === "passed" ? CheckCircle2 : status === "failed" ? XCircle : AlertTriangle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[status]}`}
    >
      <Icon className="size-3.5" />
      {status}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-ink">{value}</div>
        {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function ArtifactList({ urls }: { urls: ArtifactUrls }) {
  const items = [
    { key: "audit", label: "audit.json", url: urls.audit },
    { key: "playwrightReport", label: "Playwright report", url: urls.playwrightReport },
    { key: "securityLogs", label: "Security logs", url: urls.securityLogs },
    { key: "schemaValidation", label: "Schema validation", url: urls.schemaValidation },
    { key: "workflowRun", label: "Workflow run", url: urls.workflowRun },
  ].filter((i) => i.url);
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No artifacts recorded for this run.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.key}>
          <a
            href={i.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-academy hover:underline"
          >
            <ExternalLink className="size-3.5" /> {i.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function AuditCategoryGrid({ breakdown }: { breakdown: AuditBreakdown }) {
  const cats: Array<keyof AuditBreakdown> = [
    "security",
    "accessibility",
    "seo",
    "performance",
    "architecture",
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cats.map((c) => {
        const v = breakdown[c] ?? { errors: 0, warnings: 0, status: "unknown" as OverallStatus };
        return (
          <div
            key={c}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground capitalize">
              {c}
            </div>
            <div className="mt-1 text-lg font-semibold text-ink">{v.errors}</div>
            <div className="text-xs text-muted-foreground">
              {v.warnings} warnings
            </div>
            <div className="mt-2">
              <StatusBadge status={v.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LatestRunPanel({ run }: { run: LaunchReadinessRun }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Overall" value={<StatusBadge status={run.overall_status} />} />
        <SummaryCard label="Audit Errors" value={run.audit_errors} />
        <SummaryCard label="Audit Warnings" value={run.audit_warnings} />
        <SummaryCard label="Last Check" value={new Date(run.created_at).toLocaleString()} />
        <SummaryCard label="Playwright Passed" value={run.playwright_passed} />
        <SummaryCard label="Playwright Failed" value={run.playwright_failed} />
        <SummaryCard label="Security Passed" value={run.security_passed} />
        <SummaryCard label="Security Failed" value={run.security_failed} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Run metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <GitCommit className="size-4 text-muted-foreground" />
            <code className="text-xs">{run.commit_sha.slice(0, 12)}</code>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-muted-foreground" />
            <span>{run.branch}</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-muted-foreground" />
            <span>{run.environment}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Audit breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditCategoryGrid breakdown={run.audit_breakdown ?? {}} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Playwright</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Passed: <b>{run.playwright_passed}</b></div>
            <div>Failed: <b>{run.playwright_failed}</b></div>
            <div>Skipped: <b>{run.playwright_skipped}</b></div>
            <div>Duration: {(run.playwright_duration_ms / 1000).toFixed(1)}s</div>
            {run.artifact_urls?.playwrightReport ? (
              <a
                className="inline-flex items-center gap-1.5 text-academy hover:underline mt-2"
                href={run.artifact_urls.playwrightReport}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3.5" /> HTML report
              </a>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Schema validation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>
              Status: <StatusBadge status={run.schema_validation_status as OverallStatus} />
            </div>
            {run.schema_validation_details?.missingRoles?.length ? (
              <div>Missing roles: {run.schema_validation_details.missingRoles.join(", ")}</div>
            ) : null}
            {run.schema_validation_details?.extraRoles?.length ? (
              <div>Extra roles: {run.schema_validation_details.extraRoles.join(", ")}</div>
            ) : null}
            {run.schema_validation_details?.invalidPermissions?.length ? (
              <div>
                Invalid permissions:{" "}
                {run.schema_validation_details.invalidPermissions.join(", ")}
              </div>
            ) : null}
            {run.schema_validation_details?.timestamp ? (
              <div className="text-xs text-muted-foreground">
                Checked at {new Date(run.schema_validation_details.timestamp).toLocaleString()}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Artifacts</CardTitle>
        </CardHeader>
        <CardContent>
          <ArtifactList urls={run.artifact_urls ?? {}} />
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryTable() {
  const list = useServerFn(listReadinessHistory);
  const [page, setPage] = useState(1);
  const [branch, setBranch] = useState("");
  const [environment, setEnvironment] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const query = useQuery({
    queryKey: ["launch-readiness-history", page, branch, environment, status],
    queryFn: () =>
      list({
        data: {
          page,
          pageSize: 20,
          branch: branch || undefined,
          environment: environment === "all" ? undefined : environment,
          status: status === "all" ? undefined : status,
        },
      }),
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 20)), [total]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Historical runs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          <Input
            placeholder="Filter branch"
            value={branch}
            onChange={(e) => {
              setPage(1);
              setBranch(e.target.value);
            }}
            className="max-w-[200px]"
          />
          <Select
            value={environment}
            onValueChange={(v) => {
              setPage(1);
              setEnvironment(v);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All environments</SelectItem>
              <SelectItem value="production">production</SelectItem>
              <SelectItem value="staging">staging</SelectItem>
              <SelectItem value="preview">preview</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="passed">passed</SelectItem>
              <SelectItem value="warning">warning</SelectItem>
              <SelectItem value="failed">failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Env</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Commit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Audit errors</TableHead>
              <TableHead className="text-right">PW failed</TableHead>
              <TableHead className="text-right">Sec failed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                  No runs recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r: LaunchReadinessRun) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>{r.environment}</TableCell>
                  <TableCell>{r.branch}</TableCell>
                  <TableCell>
                    <code className="text-xs">{r.commit_sha.slice(0, 8)}</code>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.overall_status} />
                  </TableCell>
                  <TableCell className="text-right">{r.audit_errors}</TableCell>
                  <TableCell className="text-right">{r.playwright_failed}</TableCell>
                  <TableCell className="text-right">{r.security_failed}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <div>
            Page {page} of {totalPages} · {total} total
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LaunchReadinessPage() {
  const latest = useServerFn(getLatestReadiness);
  const q = useQuery({
    queryKey: ["launch-readiness-latest"],
    queryFn: () => latest(),
  });

  useEffect(() => {
    // structured access log — emitted client-side; server-side ingestion logs
    // live in the API handler. Kept off console in production builds.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[launch-readiness] dashboard view");
    }
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink">Launch Readiness</h1>
        <p className="text-sm text-muted-foreground">
          Live deployment readiness — last CI run and full history.
        </p>
      </header>

      <EnvReadinessBanner />


      {q.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : q.error ? (
        <Card>
          <CardContent className="py-10 text-center text-rose-600">
            {(q.error as Error).message}
          </CardContent>
        </Card>
      ) : !q.data ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No launch-readiness runs recorded yet. The next CI run will populate this dashboard.
          </CardContent>
        </Card>
      ) : (
        <LatestRunPanel run={q.data} />
      )}

      <HistoryTable />
    </div>
  );
}
