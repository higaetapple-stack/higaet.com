import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMySavedJobs } from "@/lib/career.functions";
import { JobCard } from "@/components/career/JobCard";

export const Route = createFileRoute("/_authenticated/dashboard/career/saved")({
  component: SavedJobs,
});

function SavedJobs() {
  const fn = useServerFn(listMySavedJobs);
  const q = useQuery({ queryKey: ["my-saved-jobs"], queryFn: () => fn() });
  const rows = q.data ?? [];

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">No saved jobs yet. Bookmark roles from the job board to review later.</p>;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {rows.map((r: any) => r.job_postings && <JobCard key={r.id} job={r.job_postings} />)}
    </div>
  );
}
