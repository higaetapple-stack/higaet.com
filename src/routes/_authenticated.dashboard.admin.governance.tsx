import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listGovernanceDecisions,
  getPendingApprovals,
  decideGovernanceApproval,
  listKnowledgePackages,
  listKnowledgeIngestionEvents,
  decideKnowledgePackage,
} from "@/lib/governance.functions";
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
        <TabsList>
          <TabsTrigger value="pending">Pending approvals</TabsTrigger>
          <TabsTrigger value="decisions">Decision log</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge packages</TabsTrigger>
          <TabsTrigger value="ingestion">Ingestion events</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><PendingApprovals /></TabsContent>
        <TabsContent value="decisions"><DecisionLog /></TabsContent>
        <TabsContent value="knowledge"><KnowledgePackages /></TabsContent>
        <TabsContent value="ingestion"><IngestionEvents /></TabsContent>
      </Tabs>
    </div>
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

function DecisionLog() {
  const fn = useServerFn(listGovernanceDecisions);
  const [tenant, setTenant] = useState("");
  const [decision, setDecision] = useState<string>("all");
  const [approval, setApproval] = useState<string>("all");

  const q = useQuery({
    queryKey: ["gov", "log", tenant, decision, approval],
    queryFn: () =>
      fn({
        data: {
          tenantId: tenant || undefined,
          decision: decision === "all" ? undefined : (decision as any),
          approvalStatus: approval === "all" ? undefined : (approval as any),
          limit: 200,
        },
      }),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Decision log</CardTitle></CardHeader>
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
            {q.data?.rows.map((r: any) => (
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
      </CardContent>
    </Card>
  );
}

function KnowledgePackages() {
  const qc = useQueryClient();
  const fn = useServerFn(listKnowledgePackages);
  const decideFn = useServerFn(decideKnowledgePackage);
  const q = useQuery({ queryKey: ["kp"], queryFn: () => fn() });
  const mutate = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject" }) => decideFn({ data: v }),
    onSuccess: () => {
      toast.success("Package updated");
      qc.invalidateQueries({ queryKey: ["kp"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Cross-organization knowledge packages</CardTitle></CardHeader>
      <CardContent>
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
            {q.data?.rows.map((r: any) => (
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
      </CardContent>
    </Card>
  );
}

function IngestionEvents() {
  const fn = useServerFn(listKnowledgeIngestionEvents);
  const q = useQuery({ queryKey: ["kie"], queryFn: () => fn() });
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
      </CardContent>
    </Card>
  );
}
