import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { listMyApplications } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/education/applications")({
  component: ApplicationsPage,
});

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualified",
  documents_pending: "Docs pending",
  application_submitted: "Submitted",
  offer_received: "Offer received",
  visa_processing: "Visa processing",
  completed: "Completed",
  closed_lost: "Closed",
};

const STATUS_TONE: Record<string, string> = {
  offer_received: "bg-emerald-100 text-emerald-900",
  completed: "bg-emerald-100 text-emerald-900",
  visa_processing: "bg-amber-100 text-amber-900",
  documents_pending: "bg-amber-100 text-amber-900",
  closed_lost: "bg-rose-100 text-rose-900",
};

function ApplicationsPage() {
  const fetcher = useServerFn(listMyApplications);
  const q = useQuery({ queryKey: ["my-applications"], queryFn: () => fetcher() });
  const rows = q.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink">All applications</h2>
        <Link
          to="/global-education/universities"
          className="inline-flex items-center gap-1.5 text-sm bg-global text-white px-3 py-2 rounded-md hover:bg-global/90"
        >
          <Plus className="size-4" /> Start new
        </Link>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl ring-1 ring-border bg-card p-8 text-center text-sm text-muted-foreground">
          No applications yet.{" "}
          <Link to="/global-education/universities" className="text-global">
            Browse universities →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
          {rows.map((a: any) => {
            const status = a.workflow_status ?? a.status;
            return (
              <li key={a.id}>
                <Link
                  to="/dashboard/applications/$id"
                  params={{ id: a.id }}
                  className="block p-4 hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-ink font-medium">
                        {a.universities?.countries?.flag_emoji} {a.universities?.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {a.university_programs?.name ?? "Program undecided"} · {a.intake ?? "Intake TBD"}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${STATUS_TONE[status] ?? "bg-muted text-ink"}`}>
                      {STATUS_LABEL[status] ?? status}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
