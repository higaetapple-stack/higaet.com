import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminDeleteProject, adminListProjects, adminUpsertProject } from "@/lib/academic.functions";
import { listPrograms } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/projects")({
  component: AdminProjects,
});

function AdminProjects() {
  const list = useServerFn(adminListProjects);
  const listProgs = useServerFn(listPrograms);
  const upsert = useServerFn(adminUpsertProject);
  const del = useServerFn(adminDeleteProject);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["admin-projects"], queryFn: () => list() });
  const progs = useQuery({ queryKey: ["admin-programs"], queryFn: () => listProgs() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    id: undefined,
    program_id: "",
    title: "",
    brief: "",
    guidelines: "",
    due_at: "",
    is_required: false,
  });

  const reset = () => setForm({ id: undefined, program_id: "", title: "", brief: "", guidelines: "", due_at: "", is_required: false });

  const m = useMutation({
    mutationFn: () =>
      upsert({
        data: {
          id: form.id,
          program_id: form.program_id,
          title: form.title,
          brief: form.brief,
          guidelines: form.guidelines,
          due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
          is_required: !!form.is_required,
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">Capstone projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Author project briefs for enrolled students.</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }} className="bg-academy text-academy-foreground hover:bg-academy/90">
          <Plus className="size-4" /> New project
        </Button>
      </div>

      <div className="mt-6 rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        {q.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (q.data ?? []).length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(q.data ?? []).map((p: any) => (
              <li key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.programs?.title}
                    {p.due_at && ` · Due ${new Date(p.due_at).toLocaleDateString()}`}
                    {p.is_required && " · Required"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { setForm({ ...p, due_at: p.due_at ? p.due_at.slice(0, 16) : "" }); setOpen(true); }}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Delete this project?") && delMut.mutate(p.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{form.id ? "Edit project" : "New project"}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Program</Label>
              <Select value={form.program_id} onValueChange={(v) => setForm({ ...form, program_id: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose program" /></SelectTrigger>
                <SelectContent>
                  {(progs.data ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Brief</Label>
              <Textarea rows={3} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Guidelines (markdown OK)</Label>
              <Textarea rows={8} value={form.guidelines} onChange={(e) => setForm({ ...form, guidelines: e.target.value })} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due (optional)</Label>
                <Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className="mt-1.5" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={!!form.is_required} onCheckedChange={(v) => setForm({ ...form, is_required: v })} />
                <Label>Required for certification</Label>
              </div>
            </div>
            <Button onClick={() => m.mutate()} disabled={m.isPending || !form.program_id || !form.title} className="w-full bg-academy text-academy-foreground hover:bg-academy/90">
              {m.isPending ? "Saving…" : "Save project"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
