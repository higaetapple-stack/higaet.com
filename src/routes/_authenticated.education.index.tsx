import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, FileText, ListChecks, UserCircle } from "lucide-react";
import { getMyEducationSummary } from "@/lib/education-hub.functions";

export const Route = createFileRoute("/_authenticated/education/")({
  component: EducationIndex,
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

function EducationIndex() {
  const fetcher = useServerFn(getMyEducationSummary);
  const q = useQuery({ queryKey: ["edu-summary"], queryFn: () => fetcher() });
  const data = q.data;

  const apps = data?.applications ?? [];
  const byStatus = data?.byStatus ?? {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<GraduationCap className="size-5" />} label="Applications" value={apps.length} />
        <StatCard icon={<FileText className="size-5" />} label="Documents" value={data?.docCount ?? 0} />
        <StatCard
          icon={<ListChecks className="size-5" />}
          label="Active"
          value={apps.length - (byStatus["closed_lost"] ?? 0) - (byStatus["completed"] ?? 0)}
        />
      </div>

      <section className="rounded-2xl ring-1 ring-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-ink">Recent applications</h2>
          <Link to="/education/applications" className="text-sm text-global hover:underline">
            View all →
          </Link>
        </div>
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No applications yet.{" "}
            <Link to="/global-education/universities" className="text-global">
              Browse universities →
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {apps.slice(0, 5).map((a) => {
              const u = a.universities as { name?: string; countries?: { flag_emoji?: string } } | null;
              return (
                <li key={a.id} className="py-3">
                  <Link to="/dashboard/applications/$id" params={{ id: a.id }} className="flex items-center justify-between gap-4 hover:bg-muted/40 -mx-2 px-2 py-1 rounded">
                    <div>
                      <div className="text-ink font-medium">
                        {u?.countries?.flag_emoji} {u?.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">{a.intake ?? "Intake TBD"}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-muted text-ink">
                      {STATUS_LABEL[a.workflow_status] ?? a.workflow_status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/education/profile" className="rounded-2xl ring-1 ring-border bg-card p-5 hover:bg-muted/30">
          <UserCircle className="size-5 text-global mb-2" />
          <div className="font-medium text-ink">Update your profile</div>
          <p className="text-sm text-muted-foreground mt-1">Helps counsellors match you with the right universities.</p>
        </Link>
        <Link to="/education/documents" className="rounded-2xl ring-1 ring-border bg-card p-5 hover:bg-muted/30">
          <FileText className="size-5 text-global mb-2" />
          <div className="font-medium text-ink">Manage documents</div>
          <p className="text-sm text-muted-foreground mt-1">Upload transcripts, SOPs, recommendation letters and more.</p>
        </Link>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl ring-1 ring-border bg-card p-5">
      <div className="text-global mb-2">{icon}</div>
      <div className="text-2xl font-display text-ink">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
