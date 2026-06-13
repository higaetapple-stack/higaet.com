import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getProject, submitProject } from "@/lib/academic.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/projects/$id")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const get = useServerFn(getProject);
  const submit = useServerFn(submitProject);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["project", id], queryFn: () => get({ data: { id } }) });

  const [repo, setRepo] = useState("");
  const [demo, setDemo] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const s: any = q.data?.submission;
    if (s) {
      setRepo(s.repo_url ?? "");
      setDemo(s.demo_url ?? "");
      setSummary(s.summary ?? "");
    }
  }, [q.data?.submission]);

  const m = useMutation({
    mutationFn: () =>
      submit({ data: { project_id: id, repo_url: repo, demo_url: demo, summary } }),
    onSuccess: () => {
      toast.success("Project submitted");
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error || !q.data) return <p className="text-sm text-muted-foreground">Not found.</p>;

  const p: any = q.data.project;
  const s: any = q.data.submission;
  const locked = s?.status === "passed" || s?.status === "reviewed";

  return (
    <div className="max-w-3xl">
      <Link to="/dashboard/projects" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-3.5" /> All projects
      </Link>

      <div className="mt-3 rounded-2xl bg-card ring-1 ring-border p-6">
        <div className="text-xs text-muted-foreground">{p.programs?.title}</div>
        <div className="flex items-start justify-between gap-2 mt-1">
          <h1 className="font-display text-2xl font-medium text-ink">{p.title}</h1>
          {s && <Badge className="capitalize">{(s.status as string).replace(/_/g, " ")}</Badge>}
        </div>
        {p.brief && <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{p.brief}</p>}
        {p.guidelines && (
          <div className="mt-4 text-sm text-ink/90 whitespace-pre-wrap">{p.guidelines}</div>
        )}
        {p.due_at && (
          <p className="text-xs text-muted-foreground mt-3">Due: {new Date(p.due_at).toLocaleString()}</p>
        )}
      </div>

      {s?.feedback && (
        <div className="mt-4 rounded-2xl bg-card ring-1 ring-border p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Faculty feedback</h3>
          <p className="text-sm text-ink mt-2 whitespace-pre-wrap">{s.feedback}</p>
          {s.score != null && (
            <p className="text-sm text-muted-foreground mt-2">
              Score: <span className="text-ink font-medium">{s.score}/100</span>
            </p>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card ring-1 ring-border p-6 space-y-4">
        <h2 className="font-display text-lg font-medium text-ink">Your submission</h2>
        <div>
          <Label>Repository URL</Label>
          <Input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/…" disabled={locked} className="mt-1.5" />
        </div>
        <div>
          <Label>Demo URL</Label>
          <Input value={demo} onChange={(e) => setDemo(e.target.value)} placeholder="https://…" disabled={locked} className="mt-1.5" />
        </div>
        <div>
          <Label>Summary / write-up</Label>
          <Textarea rows={6} value={summary} onChange={(e) => setSummary(e.target.value)} disabled={locked} className="mt-1.5" />
        </div>
        <Button onClick={() => m.mutate()} disabled={locked || m.isPending} className="bg-academy text-academy-foreground hover:bg-academy/90">
          {m.isPending ? "Submitting…" : s ? "Resubmit" : "Submit project"}
        </Button>
      </div>
    </div>
  );
}
