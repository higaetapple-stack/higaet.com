import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { studentTimeline } from "@/lib/counselor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/timeline/$id")({
  component: TimelineView,
});

const KIND_STYLES: Record<string, string> = {
  status: "bg-academy/10 text-academy",
  note: "bg-amber-100 text-amber-800",
  task: "bg-blue-100 text-blue-800",
  document: "bg-emerald-100 text-emerald-800",
  visa: "bg-purple-100 text-purple-800",
};

function TimelineView() {
  const { id } = Route.useParams();
  const fn = useServerFn(studentTimeline);
  const q = useQuery({
    queryKey: ["student-timeline", id],
    queryFn: () => fn({ data: { application_id: id } }),
  });

  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (q.error) return <div className="text-sm text-red-600">{(q.error as Error).message}</div>;
  const app = q.data?.application;
  const events = q.data?.events ?? [];

  return (
    <div className="max-w-3xl">
      <Link to="/dashboard/counselor/pipeline" className="text-xs text-muted-foreground hover:underline">
        ← Back to pipeline
      </Link>
      <div className="mt-3 mb-6 rounded-xl ring-1 ring-border bg-card p-4">
        <div className="text-xs text-muted-foreground">{app?.workflow_status}</div>
        <h2 className="text-lg font-medium text-ink">
          {app?.profiles?.full_name ?? app?.profiles?.email ?? "Student"}
        </h2>
        <div className="text-sm text-muted-foreground">
          {app?.universities?.name ?? "—"} ·{" "}
          {app?.university_programs?.name ?? app?.university_programs?.title ?? ""}
          {app?.intake ? ` · ${app.intake}` : ""}
        </div>
      </div>

      <ol className="relative border-l border-border ml-3 space-y-4">
        {events.map((e: any, i: number) => (
          <li key={i} className="pl-4 -ml-px">
            <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-academy mt-1.5" />
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${KIND_STYLES[e.kind] ?? "bg-muted text-ink"}`}>
                {e.kind}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(e.ts).toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-ink mt-1">{e.title}</div>
            {e.meta?.reason && (
              <div className="text-xs text-muted-foreground mt-0.5 italic">{e.meta.reason}</div>
            )}
            {e.meta?.status && (
              <div className="text-xs text-muted-foreground mt-0.5">Status: {e.meta.status}</div>
            )}
          </li>
        ))}
        {events.length === 0 && (
          <li className="pl-4 text-sm text-muted-foreground">No activity yet.</li>
        )}
      </ol>
    </div>
  );
}
