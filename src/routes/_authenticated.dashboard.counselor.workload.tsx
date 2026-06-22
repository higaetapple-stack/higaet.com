import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { counselorWorkload } from "@/lib/counselor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/workload")({
  component: WorkloadView,
});

function WorkloadView() {
  const fn = useServerFn(counselorWorkload);
  const q = useQuery({ queryKey: ["counselor-workload"], queryFn: () => fn() });

  return (
    <div>
      {q.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      <div className="overflow-x-auto rounded-xl ring-1 ring-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left p-3">Counselor</th>
              <th className="text-right p-3">Students</th>
              <th className="text-right p-3">Open apps</th>
              <th className="text-right p-3">Docs pending</th>
              <th className="text-right p-3">Visa open</th>
              <th className="text-right p-3">Overdue tasks</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((r: any) => (
              <tr key={r.counselor_id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-medium text-ink">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </td>
                <td className="p-3 text-right">{r.students}</td>
                <td className="p-3 text-right">{r.open_applications}</td>
                <td className="p-3 text-right">{r.documents_pending}</td>
                <td className="p-3 text-right">{r.visa_open}</td>
                <td className={`p-3 text-right ${r.overdue_tasks > 0 ? "text-red-600 font-medium" : ""}`}>
                  {r.overdue_tasks}
                </td>
              </tr>
            ))}
            {!q.isLoading && (q.data ?? []).length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No counselors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
