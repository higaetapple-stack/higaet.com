import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { myClientWorkspace } from "@/lib/technologies.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/client")({
  component: ClientPortal,
});

function ClientPortal() {
  const fn = useServerFn(myClientWorkspace);
  const q = useQuery({ queryKey: ["my-client-workspace"], queryFn: () => fn() });

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data?.client) {
    return (
      <div className="ring-1 ring-border rounded-2xl bg-card p-6 text-sm text-muted-foreground">
        Your client portal isn't linked yet. Your account manager will connect your company shortly.
      </div>
    );
  }
  const { client, projects } = q.data;

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
                <div className="text-xs text-muted-foreground">
                  {p.status} · {p.start_date ?? "—"} → {p.end_date ?? "—"}
                </div>
                {p.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>
                )}
              </div>
              <Link
                to="/dashboard/technologies/client/$id"
                params={{ id: p.id }}
                className="text-academy text-xs hover:underline"
              >
                Open →
              </Link>
            </li>
          ))}
          {projects.length === 0 && (
            <li className="text-sm text-muted-foreground">No projects yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
