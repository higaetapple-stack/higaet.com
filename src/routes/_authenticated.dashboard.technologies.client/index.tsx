import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { myClientWorkspace } from "@/lib/technologies.functions";
import { myProposalsAndContracts, getTechDocSignedUrl, updateProposalStatus } from "@/lib/tech-commercial.functions";
import { myFinance, submitClientReceipt } from "@/lib/tech-finance.functions";
import { myRequestsAndTickets, submitClientRequest, submitClientTicket } from "@/lib/tech-support.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/client/")({
  component: ClientPortal,
});

function ClientPortal() {
  const fn = useServerFn(myClientWorkspace);
  const commFn = useServerFn(myProposalsAndContracts);
  const signFn = useServerFn(getTechDocSignedUrl);
  const respondFn = useServerFn(updateProposalStatus);
  const finFn = useServerFn(myFinance);
  const supFn = useServerFn(myRequestsAndTickets);
  const receiptFn = useServerFn(submitClientReceipt);
  const reqFn = useServerFn(submitClientRequest);
  const tktFn = useServerFn(submitClientTicket);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my-client-workspace"], queryFn: () => fn() });
  const comm = useQuery({ queryKey: ["my-proposals-contracts"], queryFn: () => commFn() });
  const fin = useQuery({ queryKey: ["my-finance"], queryFn: () => finFn() });
  const sup = useQuery({ queryKey: ["my-requests-tickets"], queryFn: () => supFn() });

  const mRespond = useMutation({
    mutationFn: (v: { id: string; status: string }) => respondFn({ data: v as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-proposals-contracts"] }); toast.success("Response recorded"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mReceipt = useMutation({
    mutationFn: (v: { amount: number; reference?: string | null }) => receiptFn({ data: v as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-finance"] }); toast.success("Receipt submitted"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mRequest = useMutation({
    mutationFn: (v: { title: string; description?: string | null; type: any }) => reqFn({ data: v as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-requests-tickets"] }); toast.success("Request submitted"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mTicket = useMutation({
    mutationFn: (v: { subject: string; description?: string | null; priority: any }) => tktFn({ data: v as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-requests-tickets"] }); toast.success("Ticket created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openSigned = async (path: string | null) => {
    if (!path) return toast.error("No PDF yet");
    const { url } = await signFn({ data: { path } });
    window.open(url, "_blank");
  };

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data?.client) {
    return (
      <div className="ring-1 ring-border rounded-2xl bg-card p-6 text-sm text-muted-foreground">
        Your client portal isn't linked yet. Your account manager will connect your company shortly.
      </div>
    );
  }
  const { client, projects } = q.data;
  const proposals = comm.data?.proposals ?? [];
  const contracts = comm.data?.contracts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Client portal</div>
        <h2 className="font-display text-2xl font-medium text-ink mt-1">{client.company}</h2>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Your projects</h3>
        <ul className="space-y-2">
          {projects.map((p: any) => (
            <li key={p.id} className="ring-1 ring-border rounded-xl bg-background p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-ink font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.status} · {p.start_date ?? "—"} → {p.end_date ?? "—"}</div>
              </div>
              <Link to="/dashboard/technologies/client/$id" params={{ id: p.id }} className="text-academy text-xs hover:underline">Open →</Link>
            </li>
          ))}
          {projects.length === 0 && <li className="text-sm text-muted-foreground">No projects yet.</li>}
        </ul>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Proposals</h3>
        <ul className="space-y-2">
          {proposals.map((p: any) => (
            <li key={p.id} className="ring-1 ring-border rounded-xl bg-background p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="text-ink font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    v{p.current_version} · {p.status}
                    {p.total_amount ? ` · ${p.currency} ${Number(p.total_amount).toLocaleString()}` : ""}
                    {p.valid_until ? ` · valid until ${p.valid_until}` : ""}
                  </div>
                </div>
                {["sent", "viewed", "negotiation"].includes(p.status) && (
                  <div className="flex gap-2">
                    <button onClick={() => mRespond.mutate({ id: p.id, status: "accepted" })} className="h-8 px-3 rounded bg-academy text-white text-xs">Accept</button>
                    <button onClick={() => mRespond.mutate({ id: p.id, status: "negotiation" })} className="h-8 px-3 rounded ring-1 ring-border text-xs">Request revision</button>
                    <button onClick={() => mRespond.mutate({ id: p.id, status: "rejected" })} className="h-8 px-3 rounded ring-1 ring-border text-xs text-red-600">Reject</button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {proposals.length === 0 && <li className="text-sm text-muted-foreground">No proposals yet.</li>}
        </ul>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Contracts</h3>
        <ul className="space-y-2">
          {contracts.map((c: any) => (
            <li key={c.id} className="ring-1 ring-border rounded-xl bg-background p-3 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-ink font-medium truncate">{c.title}</div>
                <div className="text-xs text-muted-foreground">
                  {c.status}
                  {c.total_amount ? ` · ${c.currency} ${Number(c.total_amount).toLocaleString()}` : ""}
                  {c.effective_date ? ` · effective ${c.effective_date}` : ""}
                </div>
              </div>
              {c.pdf_url && (
                <button onClick={() => openSigned(c.pdf_url)} className="h-8 px-3 rounded ring-1 ring-border text-xs">Download PDF</button>
              )}
            </li>
          ))}
          {contracts.length === 0 && <li className="text-sm text-muted-foreground">No contracts yet.</li>}
        </ul>
      </div>

      <InvoicesSection invoices={fin.data?.invoices ?? []} payments={fin.data?.payments ?? []} onReceipt={mReceipt.mutate} onOpen={openSigned} />
      <RequestsSection requests={sup.data?.requests ?? []} onCreate={mRequest.mutate} />
      <TicketsSection tickets={sup.data?.tickets ?? []} onCreate={mTicket.mutate} />
    </div>
  );
}

function InvoicesSection({ invoices, payments, onReceipt, onOpen }: any) {
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  return (
    <>
      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Invoices</h3>
        <ul className="space-y-2">
          {invoices.map((i: any) => (
            <li key={i.id} className="ring-1 ring-border rounded-xl bg-background p-3 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-ink font-medium">{i.invoice_number}</div>
                <div className="text-xs text-muted-foreground">
                  {i.status} · {i.currency} {Number(i.total).toLocaleString()} · paid {Number(i.amount_paid).toLocaleString()} · due {i.due_date ?? "—"}
                </div>
              </div>
              {i.pdf_url && (
                <button onClick={() => onOpen(i.pdf_url)} className="h-8 px-3 rounded ring-1 ring-border text-xs">Download PDF</button>
              )}
            </li>
          ))}
          {invoices.length === 0 && <li className="text-sm text-muted-foreground">No invoices yet.</li>}
        </ul>
      </div>
      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Payments</h3>
        <ul className="space-y-2 mb-4">
          {payments.map((p: any) => (
            <li key={p.id} className="ring-1 ring-border rounded-xl bg-background p-3 text-sm">
              <span className="text-ink font-medium">{p.currency} {Number(p.amount).toLocaleString()}</span>
              <span className="text-xs text-muted-foreground ml-2">{p.paid_on} · {p.method} · {p.status}</span>
            </li>
          ))}
          {payments.length === 0 && <li className="text-sm text-muted-foreground">No payments recorded.</li>}
        </ul>
        <div className="flex gap-2 items-end flex-wrap pt-3 border-t border-border">
          <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="h-9 px-2 rounded ring-1 ring-border bg-background text-sm w-32" />
          <input placeholder="Reference / UTR" value={ref} onChange={(e) => setRef(e.target.value)}
            className="h-9 px-2 rounded ring-1 ring-border bg-background text-sm flex-1 min-w-[160px]" />
          <button
            disabled={!amount}
            onClick={() => {
              onReceipt({ amount: parseFloat(amount), reference: ref || null });
              setAmount(""); setRef("");
            }}
            className="h-9 px-3 rounded bg-academy text-white text-xs disabled:opacity-50">
            Submit receipt
          </button>
        </div>
      </div>
    </>
  );
}

function RequestsSection({ requests, onCreate }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("feature");
  return (
    <div className="ring-1 ring-border rounded-2xl bg-card p-5">
      <h3 className="font-display text-lg font-medium text-ink mb-3">Requests</h3>
      <ul className="space-y-2 mb-4">
        {requests.map((r: any) => (
          <li key={r.id} className="ring-1 ring-border rounded-xl bg-background p-3 text-sm">
            <div className="text-ink font-medium">{r.title}</div>
            <div className="text-xs text-muted-foreground">{r.type} · {r.priority} · {r.status}</div>
          </li>
        ))}
        {requests.length === 0 && <li className="text-sm text-muted-foreground">No requests yet.</li>}
      </ul>
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex gap-2 flex-wrap">
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="h-9 px-2 rounded ring-1 ring-border bg-background text-sm">
            {["feature", "change", "enhancement", "consultation", "bug", "other"].map((t) =>
              <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            className="h-9 px-2 rounded ring-1 ring-border bg-background text-sm flex-1 min-w-[160px]" />
        </div>
        <textarea placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 rounded ring-1 ring-border bg-background text-sm" />
        <button
          disabled={!title.trim()}
          onClick={() => {
            onCreate({ title, description: description || null, type });
            setTitle(""); setDescription("");
          }}
          className="h-9 px-3 rounded bg-academy text-white text-xs disabled:opacity-50">
          Submit request
        </button>
      </div>
    </div>
  );
}

function TicketsSection({ tickets, onCreate }: any) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  return (
    <div className="ring-1 ring-border rounded-2xl bg-card p-5">
      <h3 className="font-display text-lg font-medium text-ink mb-3">Support tickets</h3>
      <ul className="space-y-2 mb-4">
        {tickets.map((t: any) => (
          <li key={t.id} className="ring-1 ring-border rounded-xl bg-background p-3 text-sm">
            <div className="text-ink font-medium">{t.ticket_number} · {t.subject}</div>
            <div className="text-xs text-muted-foreground">{t.priority} · {t.status}</div>
          </li>
        ))}
        {tickets.length === 0 && <li className="text-sm text-muted-foreground">No tickets yet.</li>}
      </ul>
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex gap-2 flex-wrap">
          <select value={priority} onChange={(e) => setPriority(e.target.value)}
            className="h-9 px-2 rounded ring-1 ring-border bg-background text-sm">
            {["low", "medium", "high", "critical"].map((p) =>
              <option key={p} value={p}>{p}</option>)}
          </select>
          <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}
            className="h-9 px-2 rounded ring-1 ring-border bg-background text-sm flex-1 min-w-[160px]" />
        </div>
        <textarea placeholder="Describe the issue" rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 rounded ring-1 ring-border bg-background text-sm" />
        <button
          disabled={!subject.trim()}
          onClick={() => {
            onCreate({ subject, description: description || null, priority });
            setSubject(""); setDescription("");
          }}
          className="h-9 px-3 rounded bg-academy text-white text-xs disabled:opacity-50">
          Create ticket
        </button>
      </div>
    </div>
  );
}
