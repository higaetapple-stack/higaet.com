import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { myClientProject } from "@/lib/technologies.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/client/$id")({
  component: ClientProjectView,
});

function ClientProjectView() {
  const { id } = useParams({ from: "/_authenticated/dashboard/technologies/client/$id" });
  const fn = useServerFn(myClientProject);
  const q = useQuery({ queryKey: ["my-client-project", id], queryFn: () => fn({ data: { id } }) });

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="text-muted-foreground">Not found.</div>;
  const { project, milestones, documents } = q.data;
  const totalPct = milestones.length
    ? Math.round(milestones.reduce((s: number, m: any) => s + (m.completion_pct ?? 0), 0) / milestones.length)
    : 0;

  return (
    <div className="space-y-6">
      <Link to="/dashboard/technologies/client" className="text-xs text-academy hover:underline">
        ← Back to my projects
      </Link>

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{project.client?.company}</div>
        <h2 className="font-display text-2xl font-medium text-ink mt-1">{project.name}</h2>
        <div className="text-xs text-muted-foreground mt-1">
          {project.status} · {project.start_date ?? "—"} → {project.end_date ?? "—"}
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{project.description}</p>
        )}
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-lg font-medium text-ink">Milestones</h3>
          <span className="text-xs text-muted-foreground">Overall {totalPct}%</span>
        </div>
        <ul className="space-y-3">
          {milestones.map((m: any) => (
            <li key={m.id} className="ring-1 ring-border rounded-xl bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="text-ink font-medium">{m.title}</div>
                <span className="text-xs text-muted-foreground">{m.status}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Due {m.due_date ?? "—"} · {m.completion_pct}%
              </div>
              <div className="h-1.5 bg-muted rounded mt-2 overflow-hidden">
                <div className="h-full bg-academy" style={{ width: `${m.completion_pct}%` }} />
              </div>
              {m.description && (
                <p className="text-xs text-muted-foreground mt-2">{m.description}</p>
              )}
            </li>
          ))}
          {milestones.length === 0 && (
            <li className="text-sm text-muted-foreground">No milestones published yet.</li>
          )}
        </ul>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Shared documents</h3>
        <ul className="space-y-2">
          {documents.map((d: any) => (
            <li key={d.id} className="ring-1 ring-border rounded-xl bg-background p-3">
              <a href={d.file_url} target="_blank" rel="noreferrer" className="text-ink text-sm hover:underline">
                {d.file_name ?? d.file_url}
              </a>
              <div className="text-xs text-muted-foreground">
                {d.category ?? "Document"} · {new Date(d.created_at).toLocaleDateString()}
              </div>
            </li>
          ))}
          {documents.length === 0 && (
            <li className="text-sm text-muted-foreground">No documents shared yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
