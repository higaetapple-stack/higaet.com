import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminListStoryCandidates, adminUpsertStory } from "@/lib/stories.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/stories")({
  component: StoriesAdmin,
});

function StoriesAdmin() {
  const list = useServerFn(adminListStoryCandidates);
  const save = useServerFn(adminUpsertStory);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-stories"], queryFn: () => list() });

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({
    featured_success_story: false,
    success_story_summary: "",
    success_story_priority: 0,
  });

  const start = (row: any) => {
    setEditing(row);
    setForm({
      featured_success_story: !!row.featured_success_story,
      success_story_summary: row.success_story_summary ?? "",
      success_story_priority: row.success_story_priority ?? 0,
    });
  };

  const saveMut = useMutation({
    mutationFn: () => save({ data: { id: editing.id, ...form } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-stories"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-xl font-medium text-ink">Success stories</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Feature standout learners on the public <code>/success-stories</code> page. Community section auto-fills from public portfolios.
        </p>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border overflow-hidden">
          {(q.data ?? []).map((p: any) => (
            <li key={p.id} className="p-4 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink flex items-center gap-1">
                  {p.full_name || p.email}
                  {p.featured_success_story && <Star className="size-3.5 text-academy fill-academy" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.headline ?? "—"} · portfolio: {p.portfolio_visibility}
                  {p.portfolio_slug && ` · /${p.portfolio_slug}`}
                  {p.featured_success_story && ` · priority ${p.success_story_priority}`}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => start(p)}>
                <Pencil className="size-3.5" />
              </Button>
            </li>
          ))}
          {(q.data ?? []).length === 0 && (
            <li className="p-6 text-sm text-muted-foreground text-center">No profiles yet.</li>
          )}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.full_name || editing?.email}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between rounded-md ring-1 ring-border px-3 py-2">
            <span className="text-sm">Featured success story</span>
            <Switch
              checked={!!form.featured_success_story}
              onCheckedChange={(v) => setForm({ ...form, featured_success_story: v })}
            />
          </div>
          <div>
            <Label className="text-xs">Story summary (shown on /success-stories)</Label>
            <Textarea
              rows={4}
              className="mt-1.5"
              value={form.success_story_summary}
              onChange={(e) => setForm({ ...form, success_story_summary: e.target.value })}
              placeholder="One-paragraph achievement summary."
            />
          </div>
          <div>
            <Label className="text-xs">Display priority (higher = first)</Label>
            <Input
              type="number"
              className="mt-1.5"
              value={form.success_story_priority}
              onChange={(e) => setForm({ ...form, success_story_priority: Number(e.target.value) || 0 })}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="bg-academy text-academy-foreground hover:bg-academy/90"
            >
              {saveMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
