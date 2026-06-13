import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyApplications, withdrawApplication } from "@/lib/career.functions";
import { ApplicationStatusBadge } from "@/components/career/ApplicationStatusBadge";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/career/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const list = useServerFn(listMyApplications);
  const wd = useServerFn(withdrawApplication);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my-applications"], queryFn: () => list() });

  const m = useMutation({
    mutationFn: (id: string) => wd({ data: { id } }),
    onSuccess: () => {
      toast.success("Application withdrawn");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = q.data ?? [];

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0)
    return (
      <div className="rounded-2xl bg-card ring-1 ring-border p-10 text-center">
        <Briefcase className="size-8 mx-auto text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">No applications yet.</p>
        <Link to="/jobs" className="mt-3 inline-block text-xs text-academy">Browse open jobs →</Link>
      </div>
    );

  return (
    <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border overflow-hidden">
      {rows.map((r: any) => (
        <li key={r.id} className="p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/jobs/$slug"
              params={{ slug: r.job_postings?.slug }}
              className="text-sm font-medium text-ink hover:text-academy truncate block"
            >
              {r.job_postings?.title}
            </Link>
            <div className="text-xs text-muted-foreground">
              {r.job_postings?.employers?.name} · {r.job_postings?.location} · Applied {new Date(r.applied_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ApplicationStatusBadge status={r.status} />
            {!["withdrawn", "hired", "rejected"].includes(r.status) && (
              <Button size="sm" variant="ghost" onClick={() => m.mutate(r.id)} disabled={m.isPending}>
                Withdraw
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
