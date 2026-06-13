import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getAssignment, submitAssignment } from "@/lib/academic.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/assignments/$assignmentId")({
  component: AssignmentDetail,
});

const TYPES = [
  { value: "text", label: "Text response" },
  { value: "file", label: "File URL (cloud link)" },
  { value: "github", label: "GitHub URL" },
  { value: "portfolio", label: "Portfolio URL" },
  { value: "mixed", label: "Multiple" },
];

function AssignmentDetail() {
  const { assignmentId } = Route.useParams();
  const get = useServerFn(getAssignment);
  const submit = useServerFn(submitAssignment);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => get({ data: { id: assignmentId } }),
  });

  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  useEffect(() => {
    const s = q.data?.submission as any;
    if (s) {
      setType(s.submission_type ?? "text");
      setContent(s.content ?? "");
      setFileUrl(s.file_url ?? "");
      setExternalUrl(s.external_url ?? "");
    }
  }, [q.data?.submission]);

  const m = useMutation({
    mutationFn: () =>
      submit({
        data: {
          assignment_id: assignmentId,
          submission_type: type as any,
          content,
          file_url: fileUrl,
          external_url: externalUrl,
        },
      }),
    onSuccess: () => {
      toast.success("Submission saved");
      qc.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      qc.invalidateQueries({ queryKey: ["my-assignments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error || !q.data) return <p className="text-sm text-muted-foreground">Not found.</p>;

  const a: any = q.data.assignment;
  const s: any = q.data.submission;
  const locked = s?.status === "passed" || s?.status === "reviewed";

  return (
    <div className="max-w-3xl">
      <Link
        to="/dashboard/assignments"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> All assignments
      </Link>

      <div className="mt-3 rounded-2xl bg-card ring-1 ring-border p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              {a.courses?.programs?.title} · {a.courses?.title}
            </div>
            <h1 className="font-display text-2xl font-medium text-ink mt-1">{a.title}</h1>
            <div className="text-xs text-muted-foreground mt-2 flex gap-3">
              <span>Max score: {a.max_score}</span>
              {a.due_date && <span>Due: {new Date(a.due_date).toLocaleString()}</span>}
              {a.is_required && <Badge variant="secondary">Required</Badge>}
            </div>
          </div>
          {s && (
            <Badge className="capitalize">{(s.status as string).replace(/_/g, " ")}</Badge>
          )}
        </div>

        {(a.description || a.instructions) && (
          <div className="mt-5 space-y-3 text-sm text-ink/90 whitespace-pre-wrap">
            {a.description && <p>{a.description}</p>}
            {a.instructions && <p className="text-muted-foreground">{a.instructions}</p>}
          </div>
        )}
      </div>

      {s?.feedback && (
        <div className="mt-4 rounded-2xl bg-card ring-1 ring-border p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Faculty feedback</h3>
          <p className="text-sm text-ink mt-2 whitespace-pre-wrap">{s.feedback}</p>
          {s.score != null && (
            <p className="text-sm text-muted-foreground mt-2">
              Score: <span className="text-ink font-medium">{s.score}/{a.max_score}</span>
            </p>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card ring-1 ring-border p-6">
        <h2 className="font-display text-lg font-medium text-ink">
          {s ? "Update your submission" : "Your submission"}
        </h2>
        {locked && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-academy">
            <CheckCircle2 className="size-3.5" /> Submission is locked after review.
          </p>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <Label>Submission type</Label>
            <Select value={type} onValueChange={setType} disabled={locked}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes / text response</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your approach, decisions, results…"
              rows={6}
              disabled={locked}
              className="mt-1.5"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>File URL (Drive / Dropbox / PDF link)</Label>
              <Input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://…"
                disabled={locked}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>External URL (GitHub / portfolio / demo)</Label>
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://github.com/…"
                disabled={locked}
                className="mt-1.5"
              />
            </div>
          </div>

          <Button
            onClick={() => m.mutate()}
            disabled={locked || m.isPending}
            className="bg-academy text-academy-foreground hover:bg-academy/90"
          >
            {m.isPending ? "Submitting…" : s ? "Resubmit" : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
