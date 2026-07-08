import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Rocket,
  Signal,
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
  buildLaunchReport,
  getMonitoringVerification,
  probeSreHealth,
  type HealthProbeResult,
  type LaunchReportBundle,
  type MonitoringVerificationReport,
} from "@/lib/launch-report.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/launch-report")({
  component: LaunchReportPage,
});

function verdictClass(kind: "READY" | "BLOCKED") {
  return kind === "READY"
    ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30"
    : "bg-rose-500/10 text-rose-700 ring-rose-500/30";
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="size-4 text-emerald-600" />
  ) : (
    <XCircle className="size-4 text-rose-600" />
  );
}

function downloadJson(bundle: LaunchReportBundle) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `higaet-launch-report-${bundle.overallDecision}-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openPrintableReport(bundle: LaunchReportBundle) {
  const esc = (s: unknown) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c],
    );
  const decisionColor = bundle.overallDecision === "READY" ? "#047857" : "#be123c";
  const rowsChecklist = bundle.checklist.items
    .map(
      (i) => `
      <tr>
        <td>${esc(i.category)}</td>
        <td>${esc(i.title)}</td>
        <td>${esc(i.is_required ? "Yes" : "No")}</td>
        <td><b>${esc(i.status.toUpperCase())}</b></td>
        <td>${esc(i.completed_at ?? "—")}</td>
        <td>${esc(i.notes ?? "")}</td>
      </tr>`,
    )
    .join("");
  const rowsHealth = bundle.healthProbes
    .map(
      (h) => `
      <tr>
        <td>${esc(h.target)}</td>
        <td>${esc(h.url)}</td>
        <td>${esc(h.status ?? "n/a")}</td>
        <td>${esc(h.body?.healthy)}</td>
        <td>${esc(h.latencyMs)} ms</td>
        <td>${esc(h.error ?? "")}</td>
      </tr>`,
    )
    .join("");
  const rowsMon = bundle.monitoring.signals
    .map(
      (s) => `
      <tr>
        <td>${esc(s.label)}</td>
        <td>${esc(s.configured ? "OK" : "MISSING")}</td>
        <td>${esc(s.detail)}</td>
      </tr>`,
    )
    .join("");
  const rowsEnv = bundle.envReadiness.groups
    .flatMap((g) =>
      g.checks.map(
        (c) => `
      <tr>
        <td>${esc(g.category)}</td>
        <td>${esc(c.name)}</td>
        <td>${esc(c.status)}</td>
        <td>${esc(c.blocking ? "Yes" : "No")}</td>
        <td>${esc(c.detail ?? c.hint ?? "")}</td>
      </tr>`,
      ),
    )
    .join("");
  const reasons = bundle.decisionReasons.length
    ? `<ul>${bundle.decisionReasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`
    : "<p>No blockers.</p>";

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>HIGAET Production Launch Report</title>
  <style>
    body{font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;padding:32px;max-width:960px;margin:0 auto}
    h1{margin:0 0 4px}
    h2{margin-top:28px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
    .verdict{display:inline-block;padding:8px 16px;border-radius:8px;background:${decisionColor};color:white;font-weight:700;font-size:18px;margin:12px 0}
    table{border-collapse:collapse;width:100%;margin-top:8px;font-size:12px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}
    th{background:#f8fafc}
    .muted{color:#64748b;font-size:12px}
    ul{margin:6px 0 0 18px}
    @media print { body{padding:0} }
  </style></head><body>
    <h1>HIGAET Production Launch Report</h1>
    <p class="muted">Generated ${esc(bundle.generatedAt)} · Production ${esc(bundle.deploymentTargets.production)} · Staging ${esc(bundle.deploymentTargets.staging)}</p>
    <div class="verdict">DECISION: ${esc(bundle.overallDecision)}</div>
    <h2>Blockers</h2>${reasons}
    <h2>Env Readiness (${esc(bundle.envReadiness.overall)})</h2>
    <p class="muted">Present ${esc(bundle.envReadiness.totals.present)} / Missing ${esc(bundle.envReadiness.totals.missing)} / Malformed ${esc(bundle.envReadiness.totals.malformed)} / Blocking ${esc(bundle.envReadiness.totals.blockingMissing)}</p>
    <table><thead><tr><th>Category</th><th>Secret</th><th>Status</th><th>Blocking</th><th>Detail</th></tr></thead><tbody>${rowsEnv}</tbody></table>
    <h2>Monitoring (${esc(bundle.monitoring.overall)})</h2>
    <table><thead><tr><th>Signal</th><th>Status</th><th>Detail</th></tr></thead><tbody>${rowsMon}</tbody></table>
    <h2>Health Probes</h2>
    <table><thead><tr><th>Target</th><th>URL</th><th>HTTP</th><th>healthy</th><th>Latency</th><th>Error</th></tr></thead><tbody>${rowsHealth}</tbody></table>
    <h2>Operator Checklist (${esc(bundle.checklist.summary.done)}/${esc(bundle.checklist.summary.total)} done · ${esc(bundle.checklist.summary.requiredOutstanding)} required outstanding)</h2>
    <table><thead><tr><th>Category</th><th>Item</th><th>Required</th><th>Status</th><th>Completed at</th><th>Notes</th></tr></thead><tbody>${rowsChecklist}</tbody></table>
    <h2>Attachments</h2>
    <h3>Run URLs</h3><ul>${bundle.attachments.runUrls.map((r) => `<li>${esc(r.label)} — ${esc(r.href)}</li>`).join("")}</ul>
    <h3>Docs</h3><ul>${bundle.attachments.docs.map((r) => `<li>${esc(r.label)} — ${esc(r.href)}</li>`).join("")}</ul>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function LaunchReportPage() {
  const buildFn = useServerFn(buildLaunchReport);
  const probeFn = useServerFn(probeSreHealth);
  const monFn = useServerFn(getMonitoringVerification);
  const qc = useQueryClient();

  const monQ = useQuery<MonitoringVerificationReport>({
    queryKey: ["admin", "monitoring-verification"],
    queryFn: () => monFn({}),
  });

  const probeQ = useQuery<HealthProbeResult[]>({
    queryKey: ["admin", "sre-health-probe"],
    queryFn: () => probeFn({}),
  });

  const [bundle, setBundle] = useState<LaunchReportBundle | null>(null);
  const buildMut = useMutation({
    mutationFn: () => buildFn({}),
    onSuccess: (b) => {
      setBundle(b);
      qc.invalidateQueries({ queryKey: ["admin", "sre-health-probe"] });
      qc.invalidateQueries({ queryKey: ["admin", "monitoring-verification"] });
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Rocket className="size-6" /> Production launch report
          </h1>
          <p className="text-sm text-muted-foreground">
            Assemble env readiness, health probes, monitoring signals, and the operator checklist into a single bundle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => buildMut.mutate()}
            disabled={buildMut.isPending}
          >
            {buildMut.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Generate bundle
          </Button>
          <Button
            variant="secondary"
            disabled={!bundle}
            onClick={() => bundle && downloadJson(bundle)}
          >
            <Download className="mr-2 size-4" /> JSON
          </Button>
          <Button
            variant="secondary"
            disabled={!bundle}
            onClick={() => bundle && openPrintableReport(bundle)}
          >
            <FileText className="mr-2 size-4" /> PDF (print)
          </Button>
        </div>
      </div>

      {bundle && (
        <Card className="border-l-4" style={{ borderLeftColor: bundle.overallDecision === "READY" ? "#059669" : "#e11d48" }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold ring-1 ${verdictClass(bundle.overallDecision)}`}>
                {bundle.overallDecision === "READY" ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                {bundle.overallDecision}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                Bundle generated {new Date(bundle.generatedAt).toLocaleString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bundle.decisionReasons.length === 0 ? (
              <p className="text-sm text-emerald-700">No blockers detected. Attach this bundle to the launch ticket.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-rose-700">
                {bundle.decisionReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Signal className="size-5" /> Monitoring verification
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => monQ.refetch()} disabled={monQ.isFetching}>
            <RefreshCw className={`size-4 ${monQ.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {monQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {monQ.error && <p className="text-sm text-rose-600">{(monQ.error as Error).message}</p>}
          {monQ.data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Proof</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monQ.data.signals.map((s) => (
                  <TableRow key={s.key}>
                    <TableCell className="font-medium">{s.label}</TableCell>
                    <TableCell>
                      {s.configured ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700">
                          Missing
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.detail}</TableCell>
                    <TableCell className="space-x-2">
                      {s.links.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {l.label} <ExternalLink className="size-3" />
                        </a>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5" /> Health probes
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => probeQ.refetch()} disabled={probeQ.isFetching}>
            <RefreshCw className={`size-4 ${probeQ.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {probeQ.isLoading && <p className="text-sm text-muted-foreground">Probing…</p>}
          {probeQ.error && <p className="text-sm text-rose-600">{(probeQ.error as Error).message}</p>}
          {probeQ.data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>healthy</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {probeQ.data.map((h) => (
                  <TableRow key={h.target}>
                    <TableCell className="font-medium capitalize">{h.target}</TableCell>
                    <TableCell className="font-mono text-xs">{h.url}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <StatusDot ok={h.ok} />
                        <span>{h.status ?? "n/a"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{String(h.body?.healthy ?? "—")}</TableCell>
                    <TableCell className="text-muted-foreground">{h.latencyMs ?? "—"} ms</TableCell>
                    <TableCell className="text-xs text-rose-600">{h.error ?? ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
