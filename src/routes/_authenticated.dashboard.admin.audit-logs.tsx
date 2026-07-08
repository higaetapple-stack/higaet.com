import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileClock, Loader2, RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { listAuditLogs, listAuditFacets, type AuditLogRow } from "@/lib/audit-logs.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/audit-logs")({
  component: AuditLogsPage,
});

const ANY = "__any__";

function AuditLogsPage() {
  const listFn = useServerFn(listAuditLogs);
  const facetsFn = useServerFn(listAuditFacets);

  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState<string>(ANY);
  const [resourceType, setResourceType] = useState<string>(ANY);
  const [domain, setDomain] = useState<string>(ANY);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState(0);

  const facets = useQuery({
    queryKey: ["admin", "audit-logs", "facets"],
    queryFn: () => facetsFn({}),
  });

  const q = useQuery({
    queryKey: ["admin", "audit-logs", applied, { actorId, action, resourceType, domain, from, to }],
    queryFn: () =>
      listFn({
        data: {
          actorId: actorId || null,
          action: action === ANY ? null : action,
          resourceType: resourceType === ANY ? null : resourceType,
          domain: domain === ANY ? null : domain,
          from: from ? new Date(from).toISOString() : null,
          to: to ? new Date(to).toISOString() : null,
          limit: 200,
        },
      }),
  });

  const rows: AuditLogRow[] = q.data?.rows ?? [];

  const reset = () => {
    setActorId(""); setAction(ANY); setResourceType(ANY); setDomain(ANY);
    setFrom(""); setTo(""); setApplied((v) => v + 1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <FileClock className="size-6" /> Audit logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse recent admin actions. Filter by actor, action, resource type, domain, or time range.
          </p>
        </div>
        <Button onClick={() => q.refetch()} disabled={q.isFetching} variant="outline">
          {q.isFetching ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="actorId">Actor ID</Label>
              <Input id="actorId" value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="uuid" />
            </div>
            <div className="space-y-1">
              <Label>Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  {(facets.data?.actions ?? []).map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Resource type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  {(facets.data?.resourceTypes ?? []).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Domain</Label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  {(facets.data?.domains ?? []).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setApplied((v) => v + 1)} disabled={q.isFetching}>
              <Search className="mr-2 size-4" /> Apply filters
            </Button>
            <Button variant="ghost" onClick={reset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Results{" "}
            <span className="text-muted-foreground">
              ({q.isLoading ? "…" : `${rows.length} row${rows.length === 1 ? "" : "s"}`})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {q.error ? (
            <div className="text-sm text-rose-600">{(q.error as Error).message}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Metadata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const md = (r.metadata && typeof r.metadata === "object" && !Array.isArray(r.metadata) ? r.metadata : {}) as Record<string, unknown>;
                    const dom = typeof md.domain === "string" ? (md.domain as string) : null;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.actor_email ?? <span className="text-muted-foreground">{r.actor_id ?? "system"}</span>}
                        </TableCell>
                        <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                        <TableCell className="text-xs">
                          {r.resource_type ?? "—"}
                          {r.resource_id ? <span className="ml-1 text-muted-foreground">{r.resource_id.slice(0, 8)}…</span> : null}
                        </TableCell>
                        <TableCell className="text-xs">{dom ?? "—"}</TableCell>
                        <TableCell>
                          <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-muted-foreground">
                            {JSON.stringify(md, null, 0)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && !q.isLoading && (
                    <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No audit events match.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
