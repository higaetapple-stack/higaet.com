import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  listRequests, requestDetail, updateRequest, addRequestComment,
} from "@/lib/tech-support.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/requests")({
  component: RequestsPage,
});

const STATUSES = ["new", "in_review", "approved", "rejected", "in_progress", "completed"] as const;

function RequestsPage() {
  const listFn = useServerFn(listRequests);
  const updFn = useServerFn(updateRequest);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["tech-requests"], queryFn: () => listFn() });
  const [selected, setSelected] = useState<string | null>(null);

  const mUpdate = useMutation({
    mutationFn: (v: { id: string; status?: any; priority?: any }) => updFn({ data: v as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tech-requests"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-4">
      <div className="ring-1 ring-border rounded-2xl bg-card divide-y divide-border">
        {(list.data ?? []).map((r: any) => (
          <button key={r.id} onClick={() => setSelected(r.id)}
            className={`w-full p-4 text-left flex items-center gap-3 ${selected === r.id ? "bg-muted/40" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="text-ink font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.client?.company ?? "—"} · {r.type} · {r.priority}</div>
            </div>
            <select
              value={r.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => mUpdate.mutate({ id: r.id, status: e.target.value })}
              className="h-8 text-xs rounded ring-1 ring-border bg-background px-2">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </button>
        ))}
        {(list.data ?? []).length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">No requests yet.</div>
        )}
      </div>
      {selected && <RequestDetail id={selected} />}
    </div>
  );
}

function RequestDetail({ id }: { id: string }) {
  const detailFn = useServerFn(requestDetail);
  const commentFn = useServerFn(addRequestComment);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tech-request", id], queryFn: () => detailFn({ data: { id } }) });
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  const mAdd = useMutation({
    mutationFn: () => commentFn({ data: { request_id: id, body, internal } }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["tech-request", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading || !q.data) return <div className="ring-1 ring-border rounded-2xl bg-card p-4 text-sm text-muted-foreground">Loading…</div>;
  const { request, comments } = q.data;
  return (
    <div className="ring-1 ring-border rounded-2xl bg-card p-4 space-y-3">
      <div className="text-ink font-medium">{request.title}</div>
      {request.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.description}</p>}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {comments.map((c: any) => (
          <div key={c.id} className={`text-xs p-2 rounded ${c.internal ? "bg-amber-50" : "bg-muted/30"}`}>
            {c.internal && <span className="text-amber-700 font-medium mr-1">Internal:</span>}
            <span className="text-ink whitespace-pre-wrap">{c.body}</span>
          </div>
        ))}
        {comments.length === 0 && <div className="text-xs text-muted-foreground">No comments.</div>}
      </div>
      <div className="space-y-2">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2}
          placeholder="Add a comment…" className="w-full text-sm rounded ring-1 ring-border bg-background p-2" />
        <div className="flex items-center gap-2">
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
            Internal
          </label>
          <button disabled={!body.trim()} onClick={() => mAdd.mutate()}
            className="ml-auto h-8 px-3 rounded bg-academy text-white text-xs disabled:opacity-50">Send</button>
        </div>
      </div>
    </div>
  );
}
