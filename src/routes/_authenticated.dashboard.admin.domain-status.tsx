import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Globe, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDomainStatus, type DomainStatusReport } from "@/lib/domain-status.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/domain-status")({
  component: DomainStatusPage,
});

function verdictBadge(v: "pass" | "warn" | "fail") {
  if (v === "pass") return <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700" variant="outline">PASS</Badge>;
  if (v === "warn") return <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700" variant="outline">WARN</Badge>;
  return <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-700" variant="outline">FAIL</Badge>;
}

function DotOk({ ok }: { ok: boolean }) {
  return ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-rose-600" />;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function daysBadge(days: number | null) {
  if (days === null) return <span className="text-muted-foreground">—</span>;
  const cls =
    days < 14 ? "text-rose-600" : days < 30 ? "text-amber-600" : "text-emerald-600";
  return <span className={cls}>{days} days</span>;
}

function DomainStatusPage() {
  const fn = useServerFn(getDomainStatus);
  const q = useQuery<DomainStatusReport>({
    queryKey: ["admin", "domain-status"],
    queryFn: () => fn({}),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Globe className="size-6" /> Domain, SSL & HSTS status
          </h1>
          <p className="text-sm text-muted-foreground">
            Live DNS lookup (Cloudflare DoH), HTTPS reachability, HSTS inspection, and cert issuer/expiry from Certificate Transparency logs for higaet.com and www.higaet.com.
          </p>
        </div>
        <Button onClick={() => q.refetch()} disabled={q.isFetching}>
          {q.isFetching ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
          Re-check
        </Button>
      </div>

      {q.isLoading && <p className="text-sm text-muted-foreground">Checking…</p>}
      {q.error && <p className="text-sm text-rose-600">{(q.error as Error).message}</p>}

      {q.data && (
        <Card className="border-l-4" style={{ borderLeftColor: q.data.overall === "pass" ? "#059669" : q.data.overall === "warn" ? "#d97706" : "#e11d48" }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3">
              <ShieldCheck className="size-5" /> Overall {verdictBadge(q.data.overall)}
              <span className="text-sm font-normal text-muted-foreground">
                Checked {new Date(q.data.generatedAt).toLocaleString()} · Expected IP {q.data.expectedIp}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {q.data?.domains.map((d) => {
        const history = q.data?.history[d.host] ?? [];
        return (
          <Card key={d.host}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="size-4" /> {d.host}
                <span className="text-xs font-normal text-muted-foreground">({d.role})</span>
              </CardTitle>
              {verdictBadge(d.overall)}
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">DNS A record</TableCell>
                    <TableCell className="flex items-center gap-2"><DotOk ok={d.dns.ok} /> {d.dns.ok ? "match" : "mismatch"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.dns.detail}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">HTTPS / SSL reachability</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <DotOk ok={d.ssl.ok} /> {d.ssl.httpStatus ?? "n/a"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.ssl.error ? `Error: ${d.ssl.error}` : `${d.ssl.latencyMs ?? "?"} ms`}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">SSL certificate</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span>Issuer: <b>{d.cert.issuer ?? "—"}</b></span>
                        <span>Expires: {fmt(d.cert.notAfter)}</span>
                        <span>Remaining: {daysBadge(d.cert.daysRemaining)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Source: {d.cert.source}. {d.cert.detail}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">HSTS</TableCell>
                    <TableCell className="flex items-center gap-2">
                      {d.hsts.required ? (
                        d.hsts.present ? (
                          d.hsts.includesSubDomains ? (
                            <><CheckCircle2 className="size-4 text-emerald-600" /> full</>
                          ) : (
                            <><AlertTriangle className="size-4 text-amber-600" /> partial</>
                          )
                        ) : (
                          <><XCircle className="size-4 text-rose-600" /> missing</>
                        )
                      ) : (
                        <span className="text-muted-foreground">optional</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground break-all">
                      max-age={d.hsts.maxAge ?? "—"} · includeSubDomains={String(d.hsts.includesSubDomains)}
                      <div className="mt-1 font-mono text-[10px]">{d.hsts.header ?? "(no header)"}</div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent history ({history.length})
                </h4>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No previous snapshots.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        title={`${h.detail ?? ""}${h.cert_not_after ? ` · cert exp ${new Date(h.cert_not_after).toLocaleDateString()}` : ""}`}
                        className={
                          "rounded-md border px-2 py-1 text-[11px] " +
                          (h.overall === "pass"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            : h.overall === "warn"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-700")
                        }
                      >
                        <div className="font-medium uppercase">{h.overall}</div>
                        <div className="opacity-70">{new Date(h.checked_at).toLocaleString()}</div>
                        <div className="opacity-70">HTTP {h.http_status ?? "?"} · HSTS {h.hsts_max_age ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
