import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  techProjectDetail,
  upsertTechProject,
  upsertMilestone,
  deleteMilestone,
  addProjectMember,
  removeProjectMember,
  addProjectDocument,
  deleteProjectDocument,
} from "@/lib/technologies.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/projects/$id")({
  component: ProjectDetail,
});

const STATUSES = ["planning", "active", "on_hold", "completed", "cancelled"];
const MILESTONE_STATUSES = ["not_started", "in_progress", "blocked", "done", "cancelled"];
const TABS = ["overview", "milestones", "team", "documents"] as const;
type Tab = (typeof TABS)[number];

function ProjectDetail() {
  const { id } = useParams({ from: "/_authenticated/dashboard/technologies/projects/$id" });
  const detail = useServerFn(techProjectDetail);
  const update = useServerFn(upsertTechProject);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

  const q = useQuery({ queryKey: ["tech-project", id], queryFn: () => detail({ data: { id } }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["tech-project", id] });

  const mUpdate = useMutation({
    mutationFn: (v: any) => update({ data: { id, client_id: q.data!.project.client_id, name: q.data!.project.name, ...v } }),
    onSuccess: () => { invalidate(); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="text-muted-foreground">Not found.</div>;
  const p = q.data.project;

  return (
    <div>
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.client?.company ?? "Project"}</div>
        <h2 className="font-display text-2xl font-medium text-ink mt-1">{p.name}</h2>
      </div>

      <div className="border-b border-border mb-6">
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px transition-colors capitalize ${
                tab === t ? "border-academy text-academy font-medium" : "border-transparent text-muted-foreground hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {tab === "overview" && (
        <div className="ring-1 ring-border rounded-2xl bg-card p-5 space-y-4 max-w-2xl">
          <Field label="Status">
            <select
              value={p.status}
              onChange={(e) => mUpdate.mutate({ status: e.target.value })}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea
              defaultValue={p.description ?? ""}
              onBlur={(e) => e.target.value !== (p.description ?? "") && mUpdate.mutate({ description: e.target.value || null })}
              className="rounded ring-1 ring-border px-2 py-2 text-sm bg-background w-full min-h-[100px]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input
                type="date"
                defaultValue={p.start_date ?? ""}
                onChange={(e) => mUpdate.mutate({ start_date: e.target.value || null })}
                className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                defaultValue={p.end_date ?? ""}
                onChange={(e) => mUpdate.mutate({ end_date: e.target.value || null })}
                className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
              />
            </Field>
            <Field label="Budget">
              <input
                type="number"
                defaultValue={p.budget ?? ""}
                onBlur={(e) => mUpdate.mutate({ budget: e.target.value ? Number(e.target.value) : null })}
                className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
              />
            </Field>
            <Field label="Currency">
              <input
                defaultValue={p.currency ?? "USD"}
                onBlur={(e) => mUpdate.mutate({ currency: e.target.value })}
                className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
              />
            </Field>
          </div>
        </div>
      )}

      {tab === "milestones" && <MilestonesTab projectId={id} milestones={q.data.milestones} onChange={invalidate} />}
      {tab === "team" && <TeamTab projectId={id} members={q.data.members} onChange={invalidate} />}
      {tab === "documents" && <DocumentsTab projectId={id} documents={q.data.documents} onChange={invalidate} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}

function MilestonesTab({ projectId, milestones, onChange }: { projectId: string; milestones: any[]; onChange: () => void }) {
  const upsert = useServerFn(upsertMilestone);
  const del = useServerFn(deleteMilestone);
  const mUp = useMutation({ mutationFn: (v: any) => upsert({ data: v }), onSuccess: onChange, onError: (e: Error) => toast.error(e.message) });
  const mDel = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: onChange });
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex gap-2">
        <input
          placeholder="New milestone title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        />
        <button
          onClick={() => {
            if (!title) return;
            mUp.mutate({ project_id: projectId, title, order_index: milestones.length });
            setTitle("");
          }}
          className="h-9 px-3 rounded bg-academy text-white text-sm"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {milestones.map((m: any) => (
          <li key={m.id} className="ring-1 ring-border rounded-xl bg-card p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-ink font-medium">{m.title}</div>
              <div className="text-xs text-muted-foreground">
                Due {m.due_date ?? "—"} · {m.completion_pct}%
              </div>
            </div>
            <input
              type="date"
              defaultValue={m.due_date ?? ""}
              onChange={(e) => mUp.mutate({ id: m.id, project_id: projectId, title: m.title, due_date: e.target.value || null })}
              className="h-8 rounded ring-1 ring-border px-2 text-xs bg-background"
            />
            <input
              type="number"
              min={0}
              max={100}
              defaultValue={m.completion_pct}
              onBlur={(e) => mUp.mutate({ id: m.id, project_id: projectId, title: m.title, completion_pct: Number(e.target.value) })}
              className="h-8 w-16 rounded ring-1 ring-border px-2 text-xs bg-background"
            />
            <select
              value={m.status}
              onChange={(e) => mUp.mutate({ id: m.id, project_id: projectId, title: m.title, status: e.target.value as any })}
              className="h-8 rounded ring-1 ring-border px-2 text-xs bg-background"
            >
              {MILESTONE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => mDel.mutate(m.id)} className="text-xs text-red-600 px-2 h-8 rounded ring-1 ring-border">
              Delete
            </button>
          </li>
        ))}
        {milestones.length === 0 && <li className="text-sm text-muted-foreground">No milestones yet.</li>}
      </ul>
    </div>
  );
}

function TeamTab({ projectId, members, onChange }: { projectId: string; members: any[]; onChange: () => void }) {
  const addFn = useServerFn(addProjectMember);
  const rmFn = useServerFn(removeProjectMember);
  const mAdd = useMutation({ mutationFn: (v: any) => addFn({ data: v }), onSuccess: () => { onChange(); toast.success("Member added"); }, onError: (e: Error) => toast.error(e.message) });
  const mRm = useMutation({ mutationFn: (id: string) => rmFn({ data: { id } }), onSuccess: onChange });
  const [form, setForm] = useState({ user_id: "", role: "Developer", allocation_pct: 100 });

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="ring-1 ring-border rounded-2xl bg-card p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          placeholder="User ID (uuid)"
          value={form.user_id}
          onChange={(e) => setForm({ ...form, user_id: e.target.value })}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background md:col-span-2"
        />
        <input
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        />
        <button
          onClick={() => {
            if (!form.user_id) return toast.error("User id required");
            mAdd.mutate({ project_id: projectId, user_id: form.user_id, role: form.role, allocation_pct: form.allocation_pct });
            setForm({ user_id: "", role: "Developer", allocation_pct: 100 });
          }}
          className="h-9 px-3 rounded bg-academy text-white text-sm"
        >
          Add member
        </button>
      </div>
      <ul className="space-y-2">
        {members.map((m: any) => (
          <li key={m.id} className="ring-1 ring-border rounded-xl bg-card p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-ink font-medium">{m.user?.full_name ?? "Member"}</div>
              <div className="text-xs text-muted-foreground">{m.user?.email} · {m.role} · {m.allocation_pct}%</div>
            </div>
            <button onClick={() => mRm.mutate(m.id)} className="text-xs text-red-600 px-2 h-8 rounded ring-1 ring-border">
              Remove
            </button>
          </li>
        ))}
        {members.length === 0 && <li className="text-sm text-muted-foreground">No team members yet.</li>}
      </ul>
    </div>
  );
}

function DocumentsTab({ projectId, documents, onChange }: { projectId: string; documents: any[]; onChange: () => void }) {
  const addFn = useServerFn(addProjectDocument);
  const delFn = useServerFn(deleteProjectDocument);
  const mAdd = useMutation({ mutationFn: (v: any) => addFn({ data: v }), onSuccess: () => { onChange(); toast.success("Document added"); }, onError: (e: Error) => toast.error(e.message) });
  const mDel = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: onChange });
  const [form, setForm] = useState({ category: "Deliverable", file_url: "", file_name: "", visible_to_client: true });

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="ring-1 ring-border rounded-2xl bg-card p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        />
        <input
          placeholder="File name"
          value={form.file_name}
          onChange={(e) => setForm({ ...form, file_name: e.target.value })}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        />
        <input
          placeholder="File URL"
          value={form.file_url}
          onChange={(e) => setForm({ ...form, file_url: e.target.value })}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background md:col-span-2"
        />
        <label className="text-xs flex items-center gap-2 text-muted-foreground">
          <input
            type="checkbox"
            checked={form.visible_to_client}
            onChange={(e) => setForm({ ...form, visible_to_client: e.target.checked })}
          />
          Visible to client
        </label>
        <button
          onClick={() => {
            if (!form.file_url) return toast.error("File URL required");
            mAdd.mutate({
              project_id: projectId, category: form.category || undefined,
              file_url: form.file_url, file_name: form.file_name || undefined,
              visible_to_client: form.visible_to_client,
            });
            setForm({ category: "Deliverable", file_url: "", file_name: "", visible_to_client: true });
          }}
          className="h-9 px-3 rounded bg-academy text-white text-sm"
        >
          Add document
        </button>
      </div>
      <ul className="space-y-2">
        {documents.map((d: any) => (
          <li key={d.id} className="ring-1 ring-border rounded-xl bg-card p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-ink text-sm">
                {d.file_name ?? d.file_url} {d.visible_to_client && <span className="text-xs text-green-600">· shared with client</span>}
              </div>
              <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-academy hover:underline">
                {d.category ?? "Document"}
              </a>
            </div>
            <button onClick={() => mDel.mutate(d.id)} className="text-xs text-red-600 px-2 h-8 rounded ring-1 ring-border">
              Delete
            </button>
          </li>
        ))}
        {documents.length === 0 && <li className="text-sm text-muted-foreground">No documents yet.</li>}
      </ul>
    </div>
  );
}
