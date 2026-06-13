import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  listTickets, ticketDetail, updateTicket, addTicketComment, supportKpis,
} from "@/lib/tech-support.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/support")({
  component: SupportPage,
});

const STATUSES = ["open", "assigned", "in_progress", "waiting_client", "resolved", "closed"] as const;

function SupportPage() {
  const kpiFn = useServerFn(supportKpis);
  const listFn = useServerFn(listTickets);
  const updFn = useServerFn(updateTicket);
  const qc = useQueryClient();

  const kpis = useQuery({ queryKey: ["tech-support-kpis"], queryFn: () => kpiFn() });
  const tickets = useQuery({ queryKey: ["tech-tickets"], queryFn: () => listFn() });
  const [selected, setSelected] = useState<string | null>(null);

  const mUpdate = useMutation({
    mutationFn: (v: { id: string; status?: any; priority?: any }) => updFn({ data: v as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tech-tickets"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Open tickets" value={kpis.data?.open ?? 0} />
        <Kpi label="Critical" value={kpis.data?.critical ?? 0} />
        <Kpi label="Avg resolution (hrs)" value={kpis.data?.avgResolutionHrs ?? 0} />
        <Kpi label="Pending requests" value={kpis.data?.pendingRequests ?? 0} />
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4">
        <div className="ring-1 ring-border rounded-2xl bg-card divide-y divide-border">
          {(tickets.data ?? []).map((t: any) => (
            <button key={t.id} onClick={() => setSelected(t.id)}
              className={`w-full p-4 text-left flex items-center gap-3 ${selected === t.id ? "bg-muted/40" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="text-ink font-medium">{t.ticket_number} · {t.subject}</div>
                <div className="text-xs text-muted-foreground">{t.client?.company ?? "—"} · {t.priority}</div>
              </div>
              <select
                value={t.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => mUpdate.mutate({ id: t.id, status: e.target.value })}
                className="h-8 text-xs rounded ring-1 ring-border bg-background px-2">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </button>
          ))}
          {(tickets.data ?? []).length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No tickets yet.</div>
          )}
        </div>
        {selected && <TicketDetail id={selected} />}
      </div>
    </div>
  );
}

function TicketDetail({ id }: { id: string }) {
  const detailFn = useServerFn(ticketDetail);
  const commentFn = useServerFn(addTicketComment);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tech-ticket", id], queryFn: () => detailFn({ data: { id } }) });
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(true);

  const mAdd = useMutation({
    mutationFn: () => commentFn({ data: { ticket_id: id, body, internal } }),
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["tech-ticket", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading || !q.data) return <div className="ring-1 ring-border rounded-2xl bg-card p-4 text-sm text-muted-foreground">Loading…</div>;
  const { ticket, comments } = q.data;
  return (
    <div className="ring-1 ring-border rounded-2xl bg-card p-4 space-y-3">
      <div>
        <div className="text-xs text-muted-foreground">{ticket.ticket_number}</div>
        <div className="text-ink font-medium">{ticket.subject}</div>
      </div>
      {ticket.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>}
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

function Kpi({ label, value }: { label: string; value: any }) {
  return (
    <div className="ring-1 ring-border rounded-xl bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-medium text-ink mt-1">{value}</div>
    </div>
  );
}
