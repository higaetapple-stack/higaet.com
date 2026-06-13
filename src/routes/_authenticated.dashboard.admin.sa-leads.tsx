import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminListStudyAbroadLeads, adminUpdateStudyAbroadLead } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/sa-leads")({
  component: SALeadsAdmin,
});

const STATUSES = ["new", "contacted", "counseling", "applied", "lost"];

function SALeadsAdmin() {
  const list = useServerFn(adminListStudyAbroadLeads);
  const update = useServerFn(adminUpdateStudyAbroadLead);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-sa-leads"], queryFn: () => list() });
  const m = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => update({ data: { id, status } }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-sa-leads"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div>
      <h2 className="font-display text-xl font-medium text-ink mb-4">Study-abroad leads</h2>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Message</th><th className="p-3">Source</th><th className="p-3">Created</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((l: any) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-3 text-ink font-medium">{l.full_name}</td>
                  <td className="p-3"><div>{l.email}</div><div className="text-xs text-muted-foreground">{l.phone ?? ""}</div></td>
                  <td className="p-3 max-w-sm text-muted-foreground line-clamp-2">{l.message}</td>
                  <td className="p-3 text-xs">{l.source}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <select value={l.status} onChange={(e) => m.mutate({ id: l.id, status: e.target.value })} className="h-8 rounded ring-1 ring-border px-2 text-xs bg-background">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {q.data?.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No leads yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
