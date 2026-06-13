import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminListApplications, adminUpdateApplicationStatus } from "@/lib/career-admin.functions";
import { ApplicationStatusBadge } from "@/components/career/ApplicationStatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/applications")({
  component: ApplicationsAdmin,
});

const STATUSES = ["submitted", "under_review", "shortlisted", "rejected", "withdrawn", "hired"] as const;

function ApplicationsAdmin() {
  const list = useServerFn(adminListApplications);
  const upd = useServerFn(adminUpdateApplicationStatus);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-applications"], queryFn: () => list({ data: {} }) });

  const [editing, setEditing] = useState<any | null>(null);
  const [status, setStatus] = useState<string>("submitted");
  const [notes, setNotes] = useState("");

  const m = useMutation({
    mutationFn: () => upd({ data: { id: editing.id, status: status as any, notes } }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-applications"] }); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const open = (row: any) => { setEditing(row); setStatus(row.status); setNotes(row.notes ?? ""); };

  const rows = q.data ?? [];

  return (
    <div>
      <h2 className="font-display text-xl font-medium text-ink mb-4">Applications</h2>
      <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        {rows.map((r: any) => (
          <li key={r.id} className="p-4 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_auto_auto] gap-3 items-center">
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink truncate">{r.profiles?.full_name ?? r.profiles?.email}</div>
              <div className="text-xs text-muted-foreground truncate">{r.profiles?.email}</div>
            </div>
            <div className="min-w-0">
              <div className="text-sm truncate">{r.job_postings?.title}</div>
              <div className="text-xs text-muted-foreground truncate">{r.job_postings?.employers?.name} · {new Date(r.applied_at).toLocaleDateString()}</div>
            </div>
            <ApplicationStatusBadge status={r.status} />
            <div className="flex items-center gap-2">
              {r.profiles?.portfolio_slug && (
                <Link to="/portfolio/$slug" params={{ slug: r.profiles.portfolio_slug }} target="_blank" className="text-xs text-academy inline-flex items-center gap-1">
                  Portfolio <ExternalLink className="size-3" />
                </Link>
              )}
              <Button size="sm" variant="outline" onClick={() => open(r)}>Review</Button>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="p-6 text-sm text-muted-foreground text-center">No applications yet.</li>}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Review application</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Candidate</div>
                <div className="text-sm">{editing.profiles?.full_name} · {editing.profiles?.email}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Job</div>
                <div className="text-sm">{editing.job_postings?.title} · {editing.job_postings?.employers?.name}</div>
              </div>
              {editing.cover_letter && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Cover letter</div>
                  <p className="text-sm whitespace-pre-wrap mt-1">{editing.cover_letter}</p>
                </div>
              )}
              {editing.portfolio_url && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Portfolio URL</div>
                  <a href={editing.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-academy">{editing.portfolio_url}</a>
                </div>
              )}
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Internal notes</Label>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => m.mutate()} disabled={m.isPending} className="bg-academy text-academy-foreground hover:bg-academy/90">
              {m.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
