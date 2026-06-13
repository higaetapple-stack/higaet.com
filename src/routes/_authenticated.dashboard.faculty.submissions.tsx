import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { gradeSubmission, listSubmissionsToGrade } from "@/lib/academic.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/faculty/submissions")({
  component: FacultySubmissions,
});

const STATUSES = ["all", "pending", "reviewed", "passed", "failed", "needs_revision"];

function FacultySubmissions() {
  const list = useServerFn(listSubmissionsToGrade);
  const grade = useServerFn(gradeSubmission);
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");

  const q = useQuery({
    queryKey: ["faculty-submissions", statusFilter],
    queryFn: () => list({ data: { status: statusFilter } }),
  });

  const [open, setOpen] = useState<any>(null);
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [newStatus, setNewStatus] = useState("reviewed");

  const m = useMutation({
    mutationFn: () =>
      grade({
        data: {
          submission_id: open.id,
          status: newStatus as any,
          score: score === "" ? null : Number(score),
          feedback,
        },
      }),
    onSuccess: () => {
      toast.success("Submission graded");
      qc.invalidateQueries({ queryKey: ["faculty-submissions"] });
      setOpen(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openRow = (r: any) => {
    setOpen(r);
    setScore(r.score?.toString() ?? "");
    setFeedback(r.feedback ?? "");
    setNewStatus(r.status === "pending" ? "reviewed" : r.status);
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">Submissions to grade</h1>
          <p className="text-sm text-muted-foreground mt-1">Review student work for courses you teach.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        {q.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (q.data ?? []).length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No submissions in this state.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(q.data ?? []).map((r: any) => (
              <li key={r.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{r.assignments?.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {r.profiles?.full_name ?? r.profiles?.email} · {r.assignments?.courses?.title} ·{" "}
                    Submitted {new Date(r.submitted_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className="capitalize">{(r.status as string).replace(/_/g, " ")}</Badge>
                  <Button size="sm" variant="outline" onClick={() => openRow(r)}>Review</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.assignments?.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="text-muted-foreground">
                  Student: <span className="text-ink">{open.profiles?.full_name ?? open.profiles?.email}</span>
                </div>
                <div className="text-muted-foreground">
                  Type: <span className="text-ink capitalize">{open.submission_type}</span>
                </div>
                {open.content && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Response</div>
                    <p className="whitespace-pre-wrap text-ink">{open.content}</p>
                  </div>
                )}
                {open.file_url && (
                  <a href={open.file_url} target="_blank" rel="noreferrer" className="text-academy underline block">
                    Open file
                  </a>
                )}
                {open.external_url && (
                  <a href={open.external_url} target="_blank" rel="noreferrer" className="text-academy underline block">
                    Open external link
                  </a>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Score (0–{open.assignments?.max_score ?? 100})</label>
                    <Input
                      type="number"
                      min={0}
                      max={open.assignments?.max_score ?? 100}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.filter((s) => s !== "all").map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Feedback</label>
                  <Textarea rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                </div>

                <Button onClick={() => m.mutate()} disabled={m.isPending} className="w-full bg-academy text-academy-foreground hover:bg-academy/90">
                  {m.isPending ? "Saving…" : "Save grade"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
