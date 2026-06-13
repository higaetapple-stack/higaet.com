import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { techKpis, listTechProjects } from "@/lib/technologies.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/")({
  component: TechOverview,
});

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="ring-1 ring-border rounded-2xl bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-ink mt-1">{value}</div>
    </div>
  );
}

function TechOverview() {
  const kpiFn = useServerFn(techKpis);
  const listFn = useServerFn(listTechProjects);
  const kpis = useQuery({ queryKey: ["tech-kpis"], queryFn: () => kpiFn() });
  const recent = useQuery({ queryKey: ["tech-projects-recent"], queryFn: () => listFn({ data: {} }) });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Clients" value={kpis.data?.clients ?? 0} />
        <Kpi label="Active projects" value={kpis.data?.active ?? 0} />
        <Kpi label="Planning" value={kpis.data?.planning ?? 0} />
        <Kpi label="Completed" value={kpis.data?.completed ?? 0} />
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-medium text-ink">Recent projects</h2>
          <Link to="/dashboard/technologies/projects" className="text-xs text-academy hover:underline">
            View all →
          </Link>
        </div>
        <ul className="space-y-2">
          {recent.isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
          {(recent.data ?? []).slice(0, 8).map((p: any) => (
            <li key={p.id} className="ring-1 ring-border rounded-xl p-3 bg-background flex items-center gap-3">
              <div className="flex-1">
                <div className="text-ink font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.client?.company ?? "—"} · {p.status} · PM: {p.pm?.full_name ?? "—"}
                </div>
              </div>
              <Link
                to="/dashboard/technologies/projects/$id"
                params={{ id: p.id }}
                className="text-xs text-academy hover:underline"
              >
                Open →
              </Link>
            </li>
          ))}
          {!recent.isLoading && (recent.data ?? []).length === 0 && (
            <li className="text-sm text-muted-foreground">No projects yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
