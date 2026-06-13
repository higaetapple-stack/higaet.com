import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listProposals, upsertProposal } from "@/lib/tech-commercial.functions";
import { listTechClients } from "@/lib/technologies.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/proposals/")({
  component: ProposalsList,
});

const STATUSES = ["", "draft", "sent", "viewed", "negotiation", "accepted", "rejected", "expired"];

function ProposalsList() {
  const listFn = useServerFn(listProposals);
  const clientsFn = useServerFn(listTechClients);
  const createFn = useServerFn(upsertProposal);
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);

  const proposals = useQuery({
    queryKey: ["proposals", status],
    queryFn: () => listFn({ data: { status: (status || undefined) as any } }),
  });
  const clients = useQuery({ queryKey: ["tech-clients-all"], queryFn: () => clientsFn({ data: {} }) });

  const m = useMutation({
    mutationFn: (v: any) => createFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proposals"] }); setShowForm(false); toast.success("Proposal created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [form, setForm] = useState({ client_id: "", title: "", summary: "", total_amount: "", currency: "USD", valid_until: "" });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background">
          {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
        <button onClick={() => setShowForm((s) => !s)} className="ml-auto h-9 px-3 rounded bg-academy text-white text-sm">
          {showForm ? "Cancel" : "+ New proposal"}
        </button>
      </div>

      {showForm && (
        <div className="ring-1 ring-border rounded-2xl bg-card p-4 mb-4 space-y-3">
          <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background w-full">
            <option value="">Select client…</option>
            {(clients.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.company}</option>)}
          </select>
          <input placeholder="Proposal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background w-full" />
          <textarea placeholder="Short summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="rounded ring-1 ring-border px-3 py-2 text-sm bg-background w-full min-h-[60px]" />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Total amount" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background" />
            <input placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background" />
            <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background" />
          </div>
          <button onClick={() => {
            if (!form.client_id || !form.title) return toast.error("Client and title required");
            m.mutate({
              client_id: form.client_id, title: form.title, summary: form.summary || null,
              total_amount: form.total_amount ? Number(form.total_amount) : null,
              currency: form.currency || "USD", valid_until: form.valid_until || null,
            });
            setForm({ client_id: "", title: "", summary: "", total_amount: "", currency: "USD", valid_until: "" });
          }} className="h-9 px-3 rounded bg-academy text-white text-sm">Create</button>
        </div>
      )}

      <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Title</th><th className="p-3">Client</th><th className="p-3">Status</th><th className="p-3">Amount</th><th className="p-3">Valid until</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {proposals.isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {(proposals.data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 text-ink font-medium">{p.title}</td>
                <td className="p-3 text-xs">{p.client?.company ?? "—"}</td>
                <td className="p-3 text-xs">{p.status}</td>
                <td className="p-3 text-xs">{p.total_amount ? `${p.currency} ${Number(p.total_amount).toLocaleString()}` : "—"}</td>
                <td className="p-3 text-xs">{p.valid_until ?? "—"}</td>
                <td className="p-3 text-right">
                  <Link to="/dashboard/technologies/proposals/$id" params={{ id: p.id }} className="text-academy text-xs hover:underline">Open →</Link>
                </td>
              </tr>
            ))}
            {!proposals.isLoading && (proposals.data ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No proposals.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
