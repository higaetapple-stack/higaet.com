import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminListSAApplications, adminUpdateSAApplication } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/sa-applications")({
  component: SAAppsAdmin,
});

const STATUSES = ["lead", "counseling", "started", "docs_submitted", "submitted", "offer", "rejected", "enrolled"];

function SAAppsAdmin() {
  const list = useServerFn(adminListSAApplications);
  const update = useServerFn(adminUpdateSAApplication);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-sa-apps"], queryFn: () => list() });
  const m = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => update({ data: { id, status } }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-sa-apps"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div>
      <h2 className="font-display text-xl font-medium text-ink mb-4">Study-abroad applications</h2>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Student</th><th className="p-3">University</th><th className="p-3">Intake</th><th className="p-3">Created</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((a: any) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-3"><div className="text-ink">{a.profiles?.full_name ?? "—"}</div><div className="text-xs text-muted-foreground">{a.profiles?.email}</div></td>
                  <td className="p-3">{a.universities?.name ?? "—"} <span className="text-xs text-muted-foreground">· {a.universities?.countries?.name}</span></td>
                  <td className="p-3 text-xs">{a.intake ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <select value={a.status} onChange={(e) => m.mutate({ id: a.id, status: e.target.value })} className="h-8 rounded ring-1 ring-border px-2 text-xs bg-background">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {q.data?.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
