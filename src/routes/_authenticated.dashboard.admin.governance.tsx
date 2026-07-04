import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useEffect, useState } from "react";
import {
  listGovernanceDecisions,
  getPendingApprovals,
  decideGovernanceApproval,
  listKnowledgePackages,
  listKnowledgeIngestionEvents,
  listSignatureFailures,
  decideKnowledgePackage,
  exportGovernanceDecisionsCsv,
  exportKnowledgePackagesCsv,
  exportSignatureFailuresCsv,
} from "@/lib/governance.functions";
import {
  listSentryAnalyses,
  reprocessSentryIssue,
  exportSentryAnalysesCsv,
} from "@/lib/sre/sre.functions";
import {
  listIncidentClusters,
  exportIncidentClustersCsv,
  setClusterStatus,
} from "@/lib/incidents/incidents.functions";
import {
  listReleases,
  getReleaseWithCorrelations,
  setCorrelationStatus,
  syncReleases,
} from "@/lib/releases/releases.functions";
import {
  listSentryPullRequests,
  listWebhookDeadLetter,
  retryDeadLetterEvent,
} from "@/lib/sre/sre-admin.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/governance")({
  component: GovernancePage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

const DECISION_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ALLOW: "secondary",
  WARN: "default",
  REVIEW_REQUIRED: "outline",
  BLOCK: "destructive",
};

const FAILURE_REASONS = [
  "untrusted_key",
  "expired",
  "missing_signature",
  "hash_mismatch",
  "signature_mismatch",
  "malformed_signature",
  "validation_failed",
];

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function PageMeta({
  total,
  loaded,
  onLoadMore,
  hasMore,
  isFetching,
}: {
  total: number | null;
  loaded: number;
  hasMore: boolean;
  onLoadMore: () => void;
  isFetching: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
      <span>
        Showing {loaded}
        {total !== null && ` of ${total}`}
      </span>
      <Button size="sm" variant="outline" disabled={!hasMore || isFetching} onClick={onLoadMore}>
        {isFetching ? "Loading…" : hasMore ? "Load more" : "End of results"}
      </Button>
    </div>
  );
}

function GovernancePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Governance & Knowledge Review</h1>
        <p className="text-sm text-muted-foreground">
          Review autonomous governance decisions and cross-organization knowledge packages.
          All actions are advisory and audit-logged.
        </p>
      </header>
      <Tabs defaultValue="pending">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="pending">Pending approvals</TabsTrigger>
          <TabsTrigger value="decisions">Decision log</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge packages</TabsTrigger>
          <TabsTrigger value="ingestion">Ingestion events</TabsTrigger>
          <TabsTrigger value="failures">Signature failures</TabsTrigger>
          <TabsTrigger value="sre">AI SRE</TabsTrigger>
          <TabsTrigger value="prs">AI PRs</TabsTrigger>
          <TabsTrigger value="dlq">Webhook DLQ</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><PendingApprovals /></TabsContent>
        <TabsContent value="decisions"><DecisionLog /></TabsContent>
        <TabsContent value="knowledge"><KnowledgePackages /></TabsContent>
        <TabsContent value="ingestion"><IngestionEvents /></TabsContent>
        <TabsContent value="failures"><SignatureFailures /></TabsContent>
        <TabsContent value="sre"><SentryAnalyses /></TabsContent>
        <TabsContent value="prs"><SentryPullRequests /></TabsContent>
        <TabsContent value="dlq"><WebhookDeadLetter /></TabsContent>
        <TabsContent value="incidents"><IncidentClusters /></TabsContent>
        <TabsContent value="releases"><ReleaseRegressions /></TabsContent>
      </Tabs>
    </div>
  );
}

function SentryPullRequests() {
  const fn = useServerFn(listSentryPullRequests);
  const [state, setState] = useState("all");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [pages, setPages] = useState<Array<{ rows: any[]; nextCursor: string | null; total: number | null }>>([]);
  const [loading, setLoading] = useState(false);

  const filters = () => ({
    state: state === "all" ? undefined : (state as any),
    reviewOnly: reviewOnly || undefined,
    limit: PAGE_LIMIT,
  });

  async function load(reset: boolean) {
    setLoading(true);
    try {
      const cursor = reset ? undefined : pages[pages.length - 1]?.nextCursor ?? undefined;
      if (!reset && !cursor) return;
      const res = await fn({ data: { ...filters(), cursor } });
      setPages((prev) => (reset ? [res] : [...prev, res]));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (pages.length === 0) load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const rows = pages.flatMap((p) => p.rows);
  const total = pages[0]?.total ?? null;
  const hasMore = Boolean(pages[pages.length - 1]?.nextCursor);

  return (
    <Card>
      <CardHeader><CardTitle>AI-generated pull requests</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="merged">Merged</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={reviewOnly} onChange={(e) => setReviewOnly(e.target.checked)} />
            Review required only
          </label>
          <Button size="sm" onClick={() => { setPages([]); load(true); }} disabled={loading}>Apply</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>State</TableHead>
              <TableHead>PR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs font-mono">{r.issue_id}</TableCell>
                <TableCell className="text-xs font-mono">{r.branch_name}</TableCell>
                <TableCell className="text-xs">{(Number(r.confidence_score) * 100).toFixed(1)}%</TableCell>
                <TableCell>
                  <Badge variant={r.requires_human_review ? "outline" : "secondary"}>
                    {r.requires_human_review ? "required" : "auto-ok"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={r.pr_state === "failed" ? "destructive" : r.pr_state === "merged" ? "secondary" : "outline"}>
                    {r.pr_state}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {r.pr_url ? (
                    <a className="underline" href={r.pr_url} target="_blank" rel="noreferrer">
                      #{r.pr_number}
                    </a>
                  ) : r.last_error ? (
                    <span className="text-destructive" title={r.last_error}>error</span>
                  ) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PageMeta total={total} loaded={rows.length} hasMore={hasMore} isFetching={loading} onLoadMore={() => load(false)} />
      </CardContent>
    </Card>
  );
}

function WebhookDeadLetter() {
  const qc = useQueryClient();
  const fn = useServerFn(listWebhookDeadLetter);
  const retryFn = useServerFn(retryDeadLetterEvent);
  const [includeAll, setIncludeAll] = useState(false);
  const [pages, setPages] = useState<Array<{ rows: any[]; nextCursor: string | null; total: number | null }>>([]);
  const [loading, setLoading] = useState(false);

  async function load(reset: boolean) {
    setLoading(true);
    try {
      const cursor = reset ? undefined : pages[pages.length - 1]?.nextCursor ?? undefined;
      if (!reset && !cursor) return;
      const res = await fn({ data: { includeAll: includeAll || undefined, limit: PAGE_LIMIT, cursor } });
      setPages((prev) => (reset ? [res] : [...prev, res]));
    } finally {
      setLoading(false);
    }
  }

  const retry = useMutation({
    mutationFn: (id: string) => retryFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Requeued for processing");
      qc.invalidateQueries({ queryKey: ["dlq"] });
      setPages([]); load(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => { if (pages.length === 0) load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const rows = pages.flatMap((p) => p.rows);
  const total = pages[0]?.total ?? null;
  const hasMore = Boolean(pages[pages.length - 1]?.nextCursor);

  return (
    <Card>
      <CardHeader><CardTitle>Dead-lettered webhook events</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={includeAll} onChange={(e) => setIncludeAll(e.target.checked)} />
            Show all statuses (not just failures)
          </label>
          <Button size="sm" onClick={() => { setPages([]); load(true); }} disabled={loading}>Apply</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last error</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs font-mono">{r.event_type}</TableCell>
                <TableCell className="text-xs font-mono">{r.issue_id ?? "—"}</TableCell>
                <TableCell className="text-xs">{r.attempt_count}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "failed_permanent" ? "destructive" : r.status === "failed" ? "outline" : "secondary"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs max-w-md truncate" title={r.last_error ?? ""}>
                  {r.last_error ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {(r.status === "failed" || r.status === "failed_permanent") && (
                    <Button size="sm" variant="outline" disabled={retry.isPending}
                      onClick={() => retry.mutate(r.id)}>
                      Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PageMeta total={total} loaded={rows.length} hasMore={hasMore} isFetching={loading} onLoadMore={() => load(false)} />
      </CardContent>
    </Card>
  );
}

function PendingApprovals() {
  const qc = useQueryClient();
  const fn = useServerFn(getPendingApprovals);
  const decideFn = useServerFn(decideGovernanceApproval);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const q = useQuery({ queryKey: ["gov", "pending"], queryFn: () => fn() });

  const mutate = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject"; notes?: string }) =>
      decideFn({ data: v }),
    onSuccess: () => {
      toast.success("Decision recorded");
      qc.invalidateQueries({ queryKey: ["gov"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Awaiting human review</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {q.data?.rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing pending.</p>}
        {q.data?.rows.map((r: any) => (
          <div key={r.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <Badge variant={DECISION_TONE[r.decision] ?? "outline"}>{r.decision}</Badge>
                <span className="text-sm font-mono">{r.source}</span>
                {r.tenant_id && <Badge variant="outline">{r.tenant_id}</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">
                risk {r.risk_score} · conf {Number(r.confidence).toFixed(2)}
              </span>
            </div>
            {Array.isArray(r.explanation) && r.explanation.length > 0 && (
              <ul className="text-xs text-muted-foreground list-disc pl-4">
                {r.explanation.map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            )}
            <Textarea
              placeholder="Review notes (optional)"
              value={notes[r.id] ?? ""}
              onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutate.mutate({ id: r.id, action: "reject", notes: notes[r.id] })}
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => mutate.mutate({ id: r.id, action: "approve", notes: notes[r.id] })}
              >
                Approve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const PAGE_LIMIT = 100;

function DecisionLog() {
  const fn = useServerFn(listGovernanceDecisions);
  const exportFn = useServerFn(exportGovernanceDecisionsCsv);
  const [tenant, setTenant] = useState("");
  const [decision, setDecision] = useState<string>("all");
  const [approval, setApproval] = useState<string>("all");
  const [pages, setPages] = useState<Array<{ rows: any[]; nextCursor: string | null; total: number | null }>>([]);
  const [loading, setLoading] = useState(false);

  const filters = () => ({
    tenantId: tenant || undefined,
    decision: decision === "all" ? undefined : (decision as any),
    approvalStatus: approval === "all" ? undefined : (approval as any),
    limit: PAGE_LIMIT,
  });

  async function load(reset: boolean) {
    setLoading(true);
    try {
      const cursor = reset ? undefined : pages[pages.length - 1]?.nextCursor ?? undefined;
      if (!reset && !cursor) return;
      const res = await fn({ data: { ...filters(), cursor } });
      setPages((prev) => (reset ? [res] : [...prev, res]));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (pages.length === 0) load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const rows = pages.flatMap((p) => p.rows);
  const total = pages[0]?.total ?? null;
  const hasMore = Boolean(pages[pages.length - 1]?.nextCursor);

  async function onExport() {
    try {
      const { csv } = await exportFn({ data: filters() });
      downloadCsv(`governance-decisions-${Date.now()}.csv`, csv);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Decision log</CardTitle>
        <Button variant="outline" size="sm" onClick={onExport}>Download CSV</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Filter by tenant"
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            className="max-w-xs"
          />
          <Select value={decision} onValueChange={setDecision}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All decisions</SelectItem>
              <SelectItem value="ALLOW">ALLOW</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="REVIEW_REQUIRED">REVIEW_REQUIRED</SelectItem>
              <SelectItem value="BLOCK">BLOCK</SelectItem>
            </SelectContent>
          </Select>
          <Select value={approval} onValueChange={setApproval}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => load(true)} disabled={loading}>Apply filters</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Decision</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Approval</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs">{r.tenant_id ?? "—"}</TableCell>
                <TableCell className="text-xs font-mono">{r.source}</TableCell>
                <TableCell>
                  <Badge variant={DECISION_TONE[r.decision] ?? "outline"}>{r.decision}</Badge>
                </TableCell>
                <TableCell className="text-xs">{r.risk_score}</TableCell>
                <TableCell className="text-xs">{r.approval_status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PageMeta total={total} loaded={rows.length} hasMore={hasMore} isFetching={loading} onLoadMore={() => load(false)} />
      </CardContent>
    </Card>
  );
}

function KnowledgePackages() {
  const qc = useQueryClient();
  const fn = useServerFn(listKnowledgePackages);
  const decideFn = useServerFn(decideKnowledgePackage);
  const exportFn = useServerFn(exportKnowledgePackagesCsv);
  const [status, setStatus] = useState("all");
  const [trust, setTrust] = useState("all");
  const [pages, setPages] = useState<Array<{ rows: any[]; nextCursor: string | null; total: number | null }>>([]);
  const [loading, setLoading] = useState(false);

  const filters = () => ({
    status: status === "all" ? undefined : status,
    trust: trust === "all" ? undefined : trust,
    limit: PAGE_LIMIT,
  });

  async function load(reset: boolean) {
    setLoading(true);
    try {
      const cursor = reset ? undefined : pages[pages.length - 1]?.nextCursor ?? undefined;
      if (!reset && !cursor) return;
      const res = await fn({ data: { ...filters(), cursor } });
      setPages((prev) => (reset ? [res] : [...prev, res]));
    } finally {
      setLoading(false);
    }
  }

  const mutate = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject" }) => decideFn({ data: v }),
    onSuccess: () => {
      toast.success("Package updated");
      qc.invalidateQueries({ queryKey: ["kp"] });
      load(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => { if (pages.length === 0) load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const rows = pages.flatMap((p) => p.rows);
  const total = pages[0]?.total ?? null;
  const hasMore = Boolean(pages[pages.length - 1]?.nextCursor);

  async function onExport() {
    try {
      const { csv } = await exportFn({ data: filters() });
      downloadCsv(`knowledge-packages-${Date.now()}.csv`, csv);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cross-organization knowledge packages</CardTitle>
        <Button variant="outline" size="sm" onClick={onExport}>Download CSV</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={trust} onValueChange={setTrust}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All trust levels</SelectItem>
              <SelectItem value="internal">internal</SelectItem>
              <SelectItem value="staging">staging</SelectItem>
              <SelectItem value="partner">partner</SelectItem>
              <SelectItem value="experimental">experimental</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => load(true)} disabled={loading}>Apply filters</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Trust</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Signature</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{r.source_label}</TableCell>
                <TableCell><Badge variant="outline">{r.trust_level}</Badge></TableCell>
                <TableCell className="text-xs">{r.schema_version}</TableCell>
                <TableCell>
                  <Badge variant={r.signature_valid ? "secondary" : "destructive"}>
                    {r.signature_valid ? "verified" : "invalid"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(r.expires_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "approved"
                        ? "secondary"
                        : r.status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => mutate.mutate({ id: r.id, action: "reject" })}>
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => mutate.mutate({ id: r.id, action: "approve" })}>
                        Approve
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PageMeta total={total} loaded={rows.length} hasMore={hasMore} isFetching={loading} onLoadMore={() => load(false)} />
      </CardContent>
    </Card>
  );
}

function IngestionEvents() {
  const fn = useServerFn(listKnowledgeIngestionEvents);
  const q = useQuery({ queryKey: ["kie"], queryFn: () => fn({ data: { limit: PAGE_LIMIT } }) });
  return (
    <Card>
      <CardHeader><CardTitle>Ingestion events</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Trust</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs">{r.source_label}</TableCell>
                <TableCell className="text-xs">{r.trust_level}</TableCell>
                <TableCell>
                  <Badge variant={r.outcome === "accepted" ? "secondary" : "destructive"}>
                    {r.outcome}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{r.reason ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {q.data && (
          <p className="text-xs text-muted-foreground pt-2">
            Showing {q.data.rows.length}
            {q.data.total !== null && ` of ${q.data.total}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SignatureFailures() {
  const fn = useServerFn(listSignatureFailures);
  const exportFn = useServerFn(exportSignatureFailuresCsv);
  const [tenant, setTenant] = useState("");
  const [reason, setReason] = useState("all");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [pages, setPages] = useState<Array<{ rows: any[]; nextCursor: string | null; total: number | null }>>([]);
  const [loading, setLoading] = useState(false);

  const filters = () => ({
    tenantId: tenant || undefined,
    reason: reason === "all" ? undefined : reason,
    since: since ? new Date(since).toISOString() : undefined,
    until: until ? new Date(until).toISOString() : undefined,
    limit: PAGE_LIMIT,
  });

  async function load(reset: boolean) {
    setLoading(true);
    try {
      const cursor = reset ? undefined : pages[pages.length - 1]?.nextCursor ?? undefined;
      if (!reset && !cursor) return;
      const res = await fn({ data: { ...filters(), cursor } });
      setPages((prev) => (reset ? [res] : [...prev, res]));
    } finally {
      setLoading(false);
    }
  }

  async function onExport() {
    try {
      const { csv } = await exportFn({ data: filters() });
      downloadCsv(`signature-failures-${Date.now()}.csv`, csv);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  useEffect(() => { if (pages.length === 0) load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const rows = pages.flatMap((p) => p.rows);
  const total = pages[0]?.total ?? null;
  const hasMore = Boolean(pages[pages.length - 1]?.nextCursor);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Signature verification failures</CardTitle>
        <Button variant="outline" size="sm" onClick={onExport}>Download CSV</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Filter by tenant"
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            className="max-w-xs"
          />
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reasons</SelectItem>
              {FAILURE_REASONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="datetime-local"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="max-w-[14rem]"
            aria-label="From"
          />
          <Input
            type="datetime-local"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="max-w-[14rem]"
            aria-label="To"
          />
          <Button size="sm" onClick={() => load(true)} disabled={loading}>Apply filters</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Version</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-xs">{r.tenant_id ?? "—"}</TableCell>
                <TableCell className="text-xs">{r.source_label}</TableCell>
                <TableCell><Badge variant="destructive">{r.reason}</Badge></TableCell>
                <TableCell className="text-xs font-mono">{r.key_id ?? "—"}</TableCell>
                <TableCell className="text-xs">{r.schema_version ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PageMeta total={total} loaded={rows.length} hasMore={hasMore} isFetching={loading} onLoadMore={() => load(false)} />
      </CardContent>
    </Card>
  );
}

function SentryAnalyses() {
  const listFn = useServerFn(listSentryAnalyses);
  const exportFn = useServerFn(exportSentryAnalysesCsv);
  const reprocessFn = useServerFn(reprocessSentryIssue);
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [trigger, setTrigger] = useState<string>("all");
  const [autoPROnly, setAutoPROnly] = useState(false);
  const [pages, setPages] = useState<Array<{ rows: any[]; nextCursor: string | null; total: number | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filters = () => ({
    status: status === "all" ? undefined : (status as any),
    trigger: trigger === "all" ? undefined : (trigger as any),
    autoPROnly: autoPROnly || undefined,
    limit: 50,
  });

  async function load(reset: boolean) {
    setLoading(true);
    try {
      const cursor = reset ? undefined : pages[pages.length - 1]?.nextCursor ?? undefined;
      if (!reset && !cursor) return;
      const res = await listFn({ data: { ...filters(), cursor } });
      setPages((prev) => (reset ? [res] : [...prev, res]));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPages([]); load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status, trigger, autoPROnly]);

  const rows = pages.flatMap((p) => p.rows);
  const total = pages[0]?.total ?? null;
  const hasMore = Boolean(pages[pages.length - 1]?.nextCursor);

  async function onExport() {
    try {
      const { csv } = await exportFn({ data: filters() });
      downloadCsv(`sentry-analyses-${Date.now()}.csv`, csv);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const reprocess = useMutation({
    mutationFn: (issueId: string) => reprocessFn({ data: { issueId } }),
    onSuccess: (res: any) => {
      toast.success(`Reprocess: ${res?.status ?? "done"}`);
      qc.invalidateQueries({ queryKey: ["sre"] });
      setPages([]);
      load(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sentry issue analyses</CardTitle>
        <Button variant="outline" size="sm" onClick={onExport}>Download CSV</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="processed">processed</SelectItem>
              <SelectItem value="failed">failed</SelectItem>
              <SelectItem value="skipped">skipped</SelectItem>
            </SelectContent>
          </Select>
          <Select value={trigger} onValueChange={setTrigger}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All triggers</SelectItem>
              <SelectItem value="webhook">webhook</SelectItem>
              <SelectItem value="cron">cron</SelectItem>
              <SelectItem value="manual">manual</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoPROnly ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoPROnly((v) => !v)}
          >
            Auto-PR only
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Conf</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>PR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <Fragment key={r.id}>
                <TableRow>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">
                    {r.sentry_permalink ? (
                      <a className="underline" href={r.sentry_permalink} target="_blank" rel="noreferrer">
                        {r.short_id ?? r.issue_id}
                      </a>
                    ) : (
                      r.short_id ?? r.issue_id
                    )}
                    <div className="text-muted-foreground truncate max-w-sm">{r.title}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.category ?? "—"}</Badge></TableCell>
                  <TableCell className="text-xs">{r.confidence != null ? Number(r.confidence).toFixed(2) : "—"}</TableCell>
                  <TableCell className="text-xs">{r.risk_score ?? "—"}</TableCell>
                  <TableCell className="text-xs">{r.trigger}</TableCell>
                  <TableCell>
                    {r.auto_pr_recommended ? <Badge>PR</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "failed" ? "destructive" : r.status === "skipped" ? "outline" : "secondary"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}>
                      {expanded[r.id] ? "Hide" : "View"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={reprocess.isPending} onClick={() => reprocess.mutate(r.issue_id)}>
                      Reprocess
                    </Button>
                  </TableCell>
                </TableRow>
                {expanded[r.id] && (
                  <TableRow key={`${r.id}-detail`}>
                    <TableCell colSpan={9} className="bg-muted/30">
                      <div className="space-y-2 p-2 text-xs">
                        {r.error && <div className="text-destructive">Error: {r.error}</div>}
                        <div>
                          <div className="font-semibold">Root cause hypotheses</div>
                          <ul className="list-disc pl-5">
                            {(r.root_cause?.hypotheses ?? []).map((h: any, i: number) => (
                              <li key={i}>
                                <span className="font-mono">{h.category}</span> — {h.description}{" "}
                                <span className="text-muted-foreground">({h.weight.toFixed(2)})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-semibold">Fix plan</div>
                          <ul className="list-disc pl-5">
                            {(r.fix_plan ?? []).map((f: any, i: number) => (
                              <li key={i}>
                                <Badge variant="outline">{f.risk}</Badge> {f.action}{" "}
                                <span className="text-muted-foreground">target: {f.targetHint}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {r.pr_suggestion && (
                          <div>
                            <div className="font-semibold">PR suggestion</div>
                            <div className="font-mono">branch: {r.pr_suggestion.branch}</div>
                            <div className="font-mono">title: {r.pr_suggestion.title}</div>
                            <pre className="whitespace-pre-wrap rounded bg-background p-2">{r.pr_suggestion.body}</pre>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
        <PageMeta total={total} loaded={rows.length} hasMore={hasMore} isFetching={loading} onLoadMore={() => load(false)} />
      </CardContent>
    </Card>
  );
}

function IncidentClusters() {
  const listFn = useServerFn(listIncidentClusters);
  const exportFn = useServerFn(exportIncidentClustersCsv);
  const statusFn = useServerFn(setClusterStatus);
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("active");
  const [minSev, setMinSev] = useState<string>("0");
  const [pages, setPages] = useState<Array<{ rows: any[]; nextCursor: string | null; total: number | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filters = () => ({
    status: status === "all" ? undefined : (status as any),
    minSeverity: Number(minSev) || undefined,
    limit: 50,
  });

  async function load(reset: boolean) {
    setLoading(true);
    try {
      const cursor = reset ? undefined : pages[pages.length - 1]?.nextCursor ?? undefined;
      if (!reset && !cursor) return;
      const res = await listFn({ data: { ...filters(), cursor } });
      setPages((prev) => (reset ? [res] : [...prev, res]));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPages([]); load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status, minSev]);

  const rows = pages.flatMap((p) => p.rows);
  const total = pages[0]?.total ?? null;
  const hasMore = Boolean(pages[pages.length - 1]?.nextCursor);

  async function onExport() {
    try {
      const { csv } = await exportFn({ data: filters() });
      downloadCsv(`incident-clusters-${Date.now()}.csv`, csv);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const setStat = useMutation({
    mutationFn: (p: { clusterId: string; status: "active" | "resolved" | "muted" }) => statusFn({ data: p }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["incidents"] });
      setPages([]);
      load(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Active incident clusters</CardTitle>
        <Button variant="outline" size="sm" onClick={onExport}>Download CSV</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="resolved">resolved</SelectItem>
              <SelectItem value="muted">muted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={minSev} onValueChange={setMinSev}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Min severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any severity</SelectItem>
              <SelectItem value="25">Severity ≥ 25</SelectItem>
              <SelectItem value="50">Severity ≥ 50</SelectItem>
              <SelectItem value="75">Severity ≥ 75</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Last seen</TableHead>
              <TableHead>Signature / title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <Fragment key={r.id}>
                <TableRow>
                  <TableCell className="text-xs">{new Date(r.last_seen).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-mono">{r.signature}</div>
                    <div className="text-muted-foreground truncate max-w-md">{r.title}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.top_category ?? "—"}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{r.severity_score}</TableCell>
                  <TableCell className="text-xs">{r.issue_count}</TableCell>
                  <TableCell className="text-xs">{r.event_count}</TableCell>
                  <TableCell className="text-xs">{r.user_count}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "resolved" ? "secondary" : r.status === "muted" ? "outline" : "default"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}>
                      {expanded[r.id] ? "Hide" : "View"}
                    </Button>
                    {r.status !== "resolved" && (
                      <Button size="sm" variant="outline" disabled={setStat.isPending}
                        onClick={() => setStat.mutate({ clusterId: r.id, status: "resolved" })}>
                        Resolve
                      </Button>
                    )}
                    {r.status !== "muted" && (
                      <Button size="sm" variant="ghost" disabled={setStat.isPending}
                        onClick={() => setStat.mutate({ clusterId: r.id, status: "muted" })}>
                        Mute
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {expanded[r.id] && (
                  <TableRow key={`${r.id}-detail`}>
                    <TableCell colSpan={9} className="bg-muted/30">
                      <div className="space-y-1 p-2 text-xs">
                        <div>First seen: <span className="font-mono">{new Date(r.first_seen).toLocaleString()}</span></div>
                        <div>Representative issue: <span className="font-mono">{r.representative_issue_id ?? "—"}</span></div>
                        <div>Last analysis hash: <span className="font-mono">{r.last_analysis_hash ?? "—"}</span></div>
                        <div>Last analyzed: <span className="font-mono">{r.last_analyzed_at ? new Date(r.last_analyzed_at).toLocaleString() : "—"}</span></div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
        <PageMeta total={total} loaded={rows.length} hasMore={hasMore} isFetching={loading} onLoadMore={() => load(false)} />
      </CardContent>
    </Card>
  );
}

function ReleaseRegressions() {
  const listFn = useServerFn(listReleases);
  const detailFn = useServerFn(getReleaseWithCorrelations);
  const statusFn = useServerFn(setCorrelationStatus);
  const syncFn = useServerFn(syncReleases);
  const qc = useQueryClient();
  const [pages, setPages] = useState<Array<{ rows: any[]; nextCursor: string | null; total: number | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, { release: any; correlations: any[] }>>({});

  async function load(reset: boolean) {
    setLoading(true);
    try {
      const cursor = reset ? undefined : pages[pages.length - 1]?.nextCursor ?? undefined;
      if (!reset && !cursor) return;
      const res = await listFn({ data: { limit: 50, cursor } });
      setPages((prev) => (reset ? [res] : [...prev, res]));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPages([]); load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function toggle(id: string) {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    if (!details[id]) {
      try {
        const res = await detailFn({ data: { releaseId: id } });
        setDetails((s) => ({ ...s, [id]: res as any }));
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  }

  const sync = useMutation({
    mutationFn: () => syncFn({}),
    onSuccess: (r: any) => {
      toast.success(`Synced ${r?.upserted ?? 0} of ${r?.fetched ?? 0} releases`);
      qc.invalidateQueries({ queryKey: ["releases"] });
      setPages([]); setDetails({}); setOpenId(null);
      load(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: (p: { correlationId: string; status: "suspected" | "confirmed" | "dismissed" }) => statusFn({ data: p }),
    onSuccess: () => {
      toast.success("Status updated");
      // refresh open detail
      if (openId) {
        detailFn({ data: { releaseId: openId } }).then((res: any) =>
          setDetails((s) => ({ ...s, [openId]: res })),
        );
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = pages.flatMap((p) => p.rows);
  const total = pages[0]?.total ?? null;
  const hasMore = Boolean(pages[pages.length - 1]?.nextCursor);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Releases & regression correlations</CardTitle>
        <Button variant="outline" size="sm" disabled={sync.isPending} onClick={() => sync.mutate()}>
          {sync.isPending ? "Syncing…" : "Sync from Sentry"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deployed</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Commit</TableHead>
              <TableHead>Commits</TableHead>
              <TableHead>New groups</TableHead>
              <TableHead>Source</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: any) => (
              <Fragment key={r.id}>
                <TableRow>
                  <TableCell className="text-xs">{new Date(r.deployed_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {r.permalink ? (
                      <a className="underline" href={r.permalink} target="_blank" rel="noreferrer">
                        {r.short_version ?? r.version}
                      </a>
                    ) : (r.short_version ?? r.version)}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{(r.commit_sha ?? "—").slice(0, 8)}</TableCell>
                  <TableCell className="text-xs">{r.commit_count ?? 0}</TableCell>
                  <TableCell className="text-xs">{r.new_groups ?? "—"}</TableCell>
                  <TableCell className="text-xs"><Badge variant="outline">{r.source}</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => toggle(r.id)}>
                      {openId === r.id ? "Hide" : "Correlations"}
                    </Button>
                  </TableCell>
                </TableRow>
                {openId === r.id && (
                  <TableRow key={`${r.id}-detail`}>
                    <TableCell colSpan={7} className="bg-muted/30">
                      <div className="space-y-2 p-2 text-xs">
                        {r.commit_message && (
                          <div className="text-muted-foreground italic">"{r.commit_message}"</div>
                        )}
                        <div className="font-semibold">Suspected regressions</div>
                        {!details[r.id] && <div className="text-muted-foreground">Loading…</div>}
                        {details[r.id] && details[r.id].correlations.length === 0 && (
                          <div className="text-muted-foreground">No cluster spikes correlated with this release.</div>
                        )}
                        {details[r.id]?.correlations.map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between rounded border p-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={c.regression_score >= 60 ? "destructive" : "outline"}>
                                  score {c.regression_score}
                                </Badge>
                                <Badge variant="secondary">{c.status}</Badge>
                                <span className="font-mono">{c.incident_clusters?.signature}</span>
                              </div>
                              <div className="truncate">{c.incident_clusters?.title}</div>
                              <div className="text-muted-foreground">{c.reason}</div>
                            </div>
                            <div className="flex gap-1">
                              {c.status !== "confirmed" && (
                                <Button size="sm" variant="outline" disabled={setStatus.isPending}
                                  onClick={() => setStatus.mutate({ correlationId: c.id, status: "confirmed" })}>
                                  Confirm
                                </Button>
                              )}
                              {c.status !== "dismissed" && (
                                <Button size="sm" variant="ghost" disabled={setStatus.isPending}
                                  onClick={() => setStatus.mutate({ correlationId: c.id, status: "dismissed" })}>
                                  Dismiss
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
        <PageMeta total={total} loaded={rows.length} hasMore={hasMore} isFetching={loading} onLoadMore={() => load(false)} />
      </CardContent>
    </Card>
  );
}
