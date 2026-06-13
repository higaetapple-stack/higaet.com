import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { counselorKpis, myActivity } from "@/lib/counselor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/")({
  component: CounselorHome,
});

const CARDS: Array<{ key: string; label: string; tone: string }> = [
  { key: "assigned_leads", label: "Assigned leads", tone: "from-academy/10 to-academy/5" },
  { key: "assigned_applications", label: "Assigned applications", tone: "from-blue-100 to-blue-50" },
  { key: "applications_in_progress", label: "Applications in progress", tone: "from-indigo-100 to-indigo-50" },
  { key: "open_tasks", label: "Open tasks", tone: "from-amber-100 to-amber-50" },
  { key: "follow_ups_today", label: "Follow-ups due today", tone: "from-rose-100 to-rose-50" },
  { key: "offers_received", label: "Offers received", tone: "from-emerald-100 to-emerald-50" },
];

function CounselorHome() {
  const kpisFn = useServerFn(counselorKpis);
  const actFn = useServerFn(myActivity);
  const kpis = useQuery({ queryKey: ["counselor-kpis"], queryFn: () => kpisFn() });
  const acts = useQuery({ queryKey: ["counselor-activity"], queryFn: () => actFn() });

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CARDS.map((c) => (
          <div
            key={c.key}
            className={`rounded-2xl ring-1 ring-border bg-gradient-to-br ${c.tone} p-5`}
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {c.label}
            </div>
            <div className="font-display text-3xl text-ink mt-2">
              {kpis.isLoading ? "…" : (kpis.data as any)?.[c.key] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-ink">Recent activity</h3>
          <Link to="/dashboard/counselor/leads" className="text-xs text-academy hover:underline">
            View my leads →
          </Link>
        </div>
        <ul className="space-y-3">
          {acts.isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
          {(acts.data ?? []).map((a: any) => (
            <li key={a.id} className="text-sm border-l-2 border-border pl-3">
              <div className="text-ink">{a.description ?? a.event_type}</div>
              <div className="text-xs text-muted-foreground">
                {a.entity_type} · {a.actor?.full_name ?? "System"} ·{" "}
                {new Date(a.created_at).toLocaleString()}
              </div>
            </li>
          ))}
          {!acts.isLoading && (acts.data ?? []).length === 0 && (
            <li className="text-sm text-muted-foreground">No activity yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
