import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { adminListPrograms, adminSaveProgram, adminDeleteProgram, adminListUniversities } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/uniprograms")({
  component: UniProgramsAdmin,
});

const LEVELS = ["foundation", "diploma", "bachelors", "masters", "phd", "certificate"];
const blank: any = { university_id: "", name: "", slug: "", level: "masters", field: "", duration_months: "", tuition_usd: "", requirements: "", description: "", published: true };

function UniProgramsAdmin() {
  const list = useServerFn(adminListPrograms);
  const listU = useServerFn(adminListUniversities);
  const save = useServerFn(adminSaveProgram);
  const del = useServerFn(adminDeleteProgram);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-uniprograms"], queryFn: () => list() });
  const us = useQuery({ queryKey: ["admin-unis"], queryFn: () => listU() });
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank);
  const [open, setOpen] = useState(false);
  const start = (r?: any) => { setEditing(r ?? null); setForm(r ? { ...blank, ...r } : blank); setOpen(true); };
  const m = useMutation({
    mutationFn: () => save({ data: editing ? { id: editing.id, ...form } : form }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-uniprograms"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rm = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-uniprograms"] }); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink">University programs</h2>
        <Button onClick={() => start()} className="bg-global text-white hover:bg-global/90"><Plus className="size-4" /> New</Button>
      </div>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
          {(q.data ?? []).map((p: any) => (
            <li key={p.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.universities?.name} · {p.level} · {p.duration_months ?? "—"} mo</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => start(p)}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && rm.mutate(p.id)}><Trash2 className="size-3.5" /></Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit program" : "New program"}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <F label="University">
              <select value={form.university_id ?? ""} onChange={(e) => setForm({ ...form, university_id: e.target.value })} className="h-10 w-full rounded-md ring-1 ring-border px-3 text-sm bg-background">
                <option value="">—</option>
                {(us.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </F>
            <F label="Level">
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="h-10 w-full rounded-md ring-1 ring-border px-3 text-sm bg-background">
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </F>
            <F label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
            <F label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="(auto)" /></F>
            <F label="Field"><Input value={form.field ?? ""} onChange={(e) => setForm({ ...form, field: e.target.value })} /></F>
            <F label="Duration (months)"><Input type="number" value={form.duration_months ?? ""} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} /></F>
            <F label="Tuition USD"><Input type="number" value={form.tuition_usd ?? ""} onChange={(e) => setForm({ ...form, tuition_usd: e.target.value })} /></F>
            <div className="flex items-center justify-between rounded-md ring-1 ring-border px-3 py-2"><span className="text-sm">Published</span><Switch checked={!!form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /></div>
          </div>
          <F label="Requirements"><Textarea rows={3} value={form.requirements ?? ""} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></F>
          <F label="Description"><Textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></F>
          <DialogFooter>
            <Button onClick={() => m.mutate()} disabled={m.isPending} className="bg-global text-white hover:bg-global/90">{m.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function F({ label, children }: any) { return <div><Label className="text-xs">{label}</Label><div className="mt-1.5">{children}</div></div>; }
