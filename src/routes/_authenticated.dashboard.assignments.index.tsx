import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyAssignments } from "@/lib/academic.functions";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/assignments/")({
  component: AssignmentsPage,
});

const STATUS_TONE: Record<string, string> = {
  pending: "bg-muted text-ink",
  reviewed: "bg-blue-100 text-blue-700",
  passed: "bg-academy/10 text-academy",
  failed: "bg-destructive/10 text-destructive",
  needs_revision: "bg-amber-100 text-amber-800",
};

function AssignmentsPage() {
  const fetchFn = useServerFn(listMyAssignments);
  const q = useQuery({ queryKey: ["my-assignments"], queryFn: () => fetchFn() });
  const rows = q.data ?? [];

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl font-medium text-ink">My assignments</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Submit work, track grades, and respond to faculty feedback.
      </p>

      {q.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-card ring-1 ring-border p-10 text-center">
          <ClipboardList className="size-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No assignments yet. Enrol in a program to receive assignments from your faculty.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-2xl bg-card ring-1 ring-border overflow-hidden">
          {rows.map((a: any) => {
            const status = a.submission?.status ?? "not_started";
            return (
              <li key={a.id}>
                <Link
                  to="/dashboard/assignments/$assignmentId"
                  params={{ assignmentId: a.id }}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.course?.programs?.title} · {a.course?.title}
                      {a.due_date && ` · Due ${new Date(a.due_date).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {a.submission?.score != null && (
                      <span className="text-xs text-muted-foreground">{a.submission.score}/{a.max_score}</span>
                    )}
                    <Badge className={STATUS_TONE[status] ?? "bg-muted text-ink"}>
                      {status.replace(/_/g, " ")}
                    </Badge>
                    <ArrowRight className="size-4 text-muted-foreground" />
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
