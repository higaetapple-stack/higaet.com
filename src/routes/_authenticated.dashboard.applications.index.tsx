import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { listMyApplications } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/dashboard/applications/")({
  component: ApplicationsIndex,
});

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  counseling: "In counselling",
  started: "Started",
  docs_submitted: "Documents submitted",
  submitted: "Application submitted",
  offer: "Offer received",
  rejected: "Rejected",
  enrolled: "Enrolled",
};

function ApplicationsIndex() {
  const fetcher = useServerFn(listMyApplications);
  const q = useQuery({ queryKey: ["my-applications"], queryFn: () => fetcher() });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">My applications</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your study-abroad applications, upload documents, and follow your timeline.</p>
        </div>
        <Link to="/global-education/universities" className="inline-flex items-center gap-1.5 text-sm bg-global text-white px-3 py-2 rounded-md hover:bg-global/90"><Plus className="size-4" /> Start new</Link>
      </div>

      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
          {(q.data ?? []).map((a: any) => (
            <li key={a.id}>
              <Link to="/dashboard/applications/$id" params={{ id: a.id }} className="block p-4 hover:bg-muted/40">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-ink font-medium">{a.universities?.countries?.flag_emoji} {a.universities?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground mt-1">{a.university_programs?.name ?? "Program undecided"} · {a.intake ?? "Intake TBD"}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-muted text-ink">{STATUS_LABEL[a.status] ?? a.status}</span>
                </div>
              </Link>
            </li>
          ))}
          {q.data?.length === 0 && (
            <li className="p-10 text-center text-sm text-muted-foreground">
              No applications yet. <Link to="/global-education/universities" className="text-global">Browse universities →</Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
