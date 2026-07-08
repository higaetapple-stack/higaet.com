import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  listChecklistItems,
  upsertChecklistItem,
  type ChecklistItem,
} from "@/lib/launch-report.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/operator-checklist")({
  component: OperatorChecklistPage,
});

const STATUS_META: Record<ChecklistItem["status"], { label: string; className: string }> = {
  pending: { label: "Pending", className: "border-slate-500/30 bg-slate-500/10 text-slate-700" },
  in_progress: { label: "In progress", className: "border-blue-500/30 bg-blue-500/10 text-blue-700" },
  done: { label: "Done", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" },
  blocked: { label: "Blocked", className: "border-rose-500/30 bg-rose-500/10 text-rose-700" },
  skipped: { label: "Skipped", className: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
};

function ChecklistRow({
  item,
  onSave,
  saving,
}: {
  item: ChecklistItem;
  onSave: (patch: {
    id: string;
    status: ChecklistItem["status"];
    notes: string | null;
    evidence_url: string | null;
  }) => void;
  saving: boolean;
}) {
  const [status, setStatus] = useState<ChecklistItem["status"]>(item.status);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [evidence, setEvidence] = useState(item.evidence_url ?? "");
  const dirty =
    status !== item.status || notes !== (item.notes ?? "") || evidence !== (item.evidence_url ?? "");

  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{item.category}</div>
        <div className="font-medium">{item.title}</div>
        {item.description && (
          <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
        )}
        {item.is_required && (
          <Badge variant="outline" className="mt-2 border-primary/30 bg-primary/10 text-xs">
            Required
          </Badge>
        )}
      </TableCell>
      <TableCell className="w-40 align-top">
        <Select value={status} onValueChange={(v) => setStatus(v as ChecklistItem["status"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_META) as ChecklistItem["status"][]).map((k) => (
              <SelectItem key={k} value={k}>
                {STATUS_META[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {item.completed_at && (
          <div className="mt-1 text-[11px] text-muted-foreground">
            Completed {new Date(item.completed_at).toLocaleString()}
          </div>
        )}
      </TableCell>
      <TableCell className="align-top">
        <Input
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          placeholder="Evidence URL (workflow run, ticket, screenshot)"
        />
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          className="mt-2"
        />
      </TableCell>
      <TableCell className="w-24 align-top">
        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={() =>
            onSave({
              id: item.id,
              status,
              notes: notes || null,
              evidence_url: evidence || null,
            })
          }
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function OperatorChecklistPage() {
  const listFn = useServerFn(listChecklistItems);
  const upsertFn = useServerFn(upsertChecklistItem);
  const qc = useQueryClient();

  const q = useQuery<ChecklistItem[]>({
    queryKey: ["admin", "operator-checklist"],
    queryFn: () => listFn({}),
  });

  const mut = useMutation({
    mutationFn: (patch: {
      id: string;
      status: ChecklistItem["status"];
      notes: string | null;
      evidence_url: string | null;
    }) => upsertFn({ data: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "operator-checklist"] }),
  });

  const summary = useMemo(() => {
    const items = q.data ?? [];
    const done = items.filter((i) => i.status === "done").length;
    const blocked = items.filter((i) => i.status === "blocked").length;
    const requiredOutstanding = items.filter(
      (i) => i.is_required && i.status !== "done" && i.status !== "skipped",
    ).length;
    return {
      total: items.length,
      done,
      blocked,
      requiredOutstanding,
      overall: (requiredOutstanding === 0 ? "READY" : "BLOCKED") as "READY" | "BLOCKED",
    };
  }, [q.data]);

  const grouped = useMemo(() => {
    const items = q.data ?? [];
    const byCat = new Map<string, ChecklistItem[]>();
    for (const it of items) {
      const arr = byCat.get(it.category) ?? [];
      arr.push(it);
      byCat.set(it.category, arr);
    }
    return Array.from(byCat.entries());
  }, [q.data]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ClipboardCheck className="size-6" /> Operator readiness checklist
          </h1>
          <p className="text-sm text-muted-foreground">
            Track each production cutover item. Completion timestamp and operator are recorded automatically.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={`mr-2 size-4 ${q.isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card
        className="border-l-4"
        style={{ borderLeftColor: summary.overall === "READY" ? "#059669" : "#e11d48" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold ring-1 ${
                summary.overall === "READY"
                  ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30"
                  : "bg-rose-500/10 text-rose-700 ring-rose-500/30"
              }`}
            >
              {summary.overall === "READY" ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <XCircle className="size-4" />
              )}
              {summary.overall}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {summary.done}/{summary.total} done · {summary.requiredOutstanding} required outstanding · {summary.blocked} blocked
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {q.error && <p className="text-sm text-rose-600">{(q.error as Error).message}</p>}

      {grouped.map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evidence &amp; notes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <ChecklistRow
                    key={it.id}
                    item={it}
                    saving={mut.isPending && mut.variables?.id === it.id}
                    onSave={(patch) => mut.mutate(patch)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
