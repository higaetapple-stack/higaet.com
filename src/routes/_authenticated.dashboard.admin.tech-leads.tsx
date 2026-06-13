import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminListTechLeads, adminUpdateTechLead } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/tech-leads")({
  component: TechLeadsAdmin,
});

const STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"];

function TechLeadsAdmin() {
  const list = useServerFn(adminListTechLeads);
  const update = useServerFn(adminUpdateTechLead);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-tech-leads"], queryFn: () => list() });
  const m = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => update({ data: { id, status } }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-tech-leads"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div>
      <h2 className="font-display text-xl font-medium text-ink mb-4">Technologies leads</h2>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Interest</th><th className="p-3">Message</th><th className="p-3">Created</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((l: any) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-3 text-ink font-medium">{l.full_name} <div className="text-xs text-muted-foreground">{l.company}</div></td>
                  <td className="p-3"><div>{l.email}</div><div className="text-xs text-muted-foreground">{l.phone ?? ""}</div></td>
                  <td className="p-3 text-xs">{l.service_interest}</td>
                  <td className="p-3 max-w-sm text-muted-foreground line-clamp-2">{l.message}</td>
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
