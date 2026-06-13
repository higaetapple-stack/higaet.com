import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listTechProjects, listTechClients, upsertTechProject } from "@/lib/technologies.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/projects/")({
  component: ProjectsList,
});

const STATUSES = ["", "planning", "active", "on_hold", "completed", "cancelled"];

function ProjectsList() {
  const listFn = useServerFn(listTechProjects);
  const clientsFn = useServerFn(listTechClients);
  const createFn = useServerFn(upsertTechProject);
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);

  const projects = useQuery({
    queryKey: ["tech-projects", status],
    queryFn: () => listFn({ data: { status: (status || undefined) as any } }),
  });
  const clients = useQuery({ queryKey: ["tech-clients-all"], queryFn: () => clientsFn({ data: {} }) });

  const m = useMutation({
    mutationFn: (v: any) => createFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tech-projects"] });
      qc.invalidateQueries({ queryKey: ["tech-kpis"] });
      setShowForm(false);
      toast.success("Project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [form, setForm] = useState({ client_id: "", name: "", description: "" });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="ml-auto h-9 px-3 rounded bg-academy text-white text-sm"
        >
          {showForm ? "Cancel" : "+ New project"}
        </button>
      </div>

      {showForm && (
        <div className="ring-1 ring-border rounded-2xl bg-card p-4 mb-4 space-y-3">
          <select
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background w-full"
          >
            <option value="">Select client…</option>
            {(clients.data ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.company}</option>
            ))}
          </select>
          <input
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background w-full"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded ring-1 ring-border px-3 py-2 text-sm bg-background w-full min-h-[80px]"
          />
          <button
            onClick={() => {
              if (!form.client_id || !form.name) return toast.error("Client and name required");
              m.mutate({ client_id: form.client_id, name: form.name, description: form.description || null });
              setForm({ client_id: "", name: "", description: "" });
            }}
            className="h-9 px-3 rounded bg-academy text-white text-sm"
          >
            Create
          </button>
        </div>
      )}

      <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Client</th>
              <th className="p-3">Status</th>
              <th className="p-3">PM</th>
              <th className="p-3">Dates</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.isLoading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {(projects.data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 text-ink font-medium">{p.name}</td>
                <td className="p-3 text-xs">{p.client?.company ?? "—"}</td>
                <td className="p-3 text-xs">{p.status}</td>
                <td className="p-3 text-xs">{p.pm?.full_name ?? "—"}</td>
                <td className="p-3 text-xs">{p.start_date ?? "—"} → {p.end_date ?? "—"}</td>
                <td className="p-3 text-right">
                  <Link
                    to="/dashboard/technologies/projects/$id"
                    params={{ id: p.id }}
                    className="text-academy text-xs hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {!projects.isLoading && (projects.data ?? []).length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No projects.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
