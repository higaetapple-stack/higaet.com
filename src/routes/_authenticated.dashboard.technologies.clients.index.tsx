import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listTechClients, upsertTechClient } from "@/lib/technologies.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/clients/")({
  component: ClientsList,
});

const STATUSES = ["", "lead", "discovery", "proposal", "approved", "active", "completed", "archived"];

function ClientsList() {
  const listFn = useServerFn(listTechClients);
  const upFn = useServerFn(upsertTechClient);
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: "", contact_person: "", email: "", industry: "" });

  const clients = useQuery({
    queryKey: ["tech-clients", status, q],
    queryFn: () => listFn({ data: { status: (status || undefined) as any, q: q || undefined } }),
  });

  const m = useMutation({
    mutationFn: (v: any) => upFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tech-clients"] });
      qc.invalidateQueries({ queryKey: ["tech-kpis"] });
      setShowForm(false);
      setForm({ company: "", contact_person: "", email: "", industry: "" });
      toast.success("Client saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company…"
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
        <button onClick={() => setShowForm((s) => !s)} className="ml-auto h-9 px-3 rounded bg-academy text-white text-sm">
          {showForm ? "Cancel" : "+ New client"}
        </button>
      </div>

      {showForm && (
        <div className="ring-1 ring-border rounded-2xl bg-card p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          <input placeholder="Company *" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background md:col-span-2" />
          <input placeholder="Contact person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background" />
          <input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
            className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background" />
          <button
            onClick={() => {
              if (!form.company) return toast.error("Company required");
              m.mutate({
                company: form.company,
                contact_person: form.contact_person || null,
                email: form.email || null,
                industry: form.industry || null,
              });
            }}
            className="h-9 px-3 rounded bg-academy text-white text-sm md:col-span-2"
          >
            Create client
          </button>
        </div>
      )}

      <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Industry</th>
              <th className="p-3">Status</th>
              <th className="p-3">Owner</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {clients.isLoading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {(clients.data ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 text-ink font-medium">{c.company}</td>
                <td className="p-3 text-xs">
                  {c.contact_person ?? "—"}
                  <div className="text-muted-foreground">{c.email}</div>
                </td>
                <td className="p-3 text-xs">{c.industry ?? "—"}</td>
                <td className="p-3 text-xs">{c.status}</td>
                <td className="p-3 text-xs">{c.owner_profile?.full_name ?? "—"}</td>
                <td className="p-3 text-right">
                  <Link
                    to="/dashboard/technologies/clients/$id"
                    params={{ id: c.id }}
                    className="text-academy text-xs hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {!clients.isLoading && (clients.data ?? []).length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No clients.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
