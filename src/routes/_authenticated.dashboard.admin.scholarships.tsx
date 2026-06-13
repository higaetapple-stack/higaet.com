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
import { adminListScholarships, adminSaveScholarship, adminDeleteScholarship, adminListCountries, adminListUniversities } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/scholarships")({
  component: SchAdmin,
});

const blank: any = { name: "", slug: "", country_id: "", university_id: "", amount_usd: "", coverage: "", deadline: "", eligibility: "", description: "", apply_url: "", published: true };

function SchAdmin() {
  const list = useServerFn(adminListScholarships);
  const listC = useServerFn(adminListCountries);
  const listU = useServerFn(adminListUniversities);
  const save = useServerFn(adminSaveScholarship);
  const del = useServerFn(adminDeleteScholarship);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-schol"], queryFn: () => list() });
  const cs = useQuery({ queryKey: ["admin-countries"], queryFn: () => listC() });
  const us = useQuery({ queryKey: ["admin-unis"], queryFn: () => listU() });
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank);
  const [open, setOpen] = useState(false);
  const start = (r?: any) => { setEditing(r ?? null); setForm(r ? { ...blank, ...r, country_id: r.country_id ?? "", university_id: r.university_id ?? "" } : blank); setOpen(true); };
  const m = useMutation({
    mutationFn: () => {
      const payload: any = { ...form, country_id: form.country_id || undefined, university_id: form.university_id || undefined };
      if (!payload.deadline) delete payload.deadline;
      return save({ data: editing ? { id: editing.id, ...payload } : payload });
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-schol"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rm = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-schol"] }); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink">Scholarships</h2>
        <Button onClick={() => start()} className="bg-global text-white hover:bg-global/90"><Plus className="size-4" /> New</Button>
      </div>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
          {(q.data ?? []).map((s: any) => (
            <li key={s.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.countries?.name ?? "Any country"} · {s.universities?.name ?? "Any university"} · ${Number(s.amount_usd ?? 0).toLocaleString()}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => start(s)}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && rm.mutate(s.id)}><Trash2 className="size-3.5" /></Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit scholarship" : "New scholarship"}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <F label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
            <F label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="(auto)" /></F>
            <F label="Country">
              <select value={form.country_id ?? ""} onChange={(e) => setForm({ ...form, country_id: e.target.value })} className="h-10 w-full rounded-md ring-1 ring-border px-3 text-sm bg-background">
                <option value="">—</option>
                {(cs.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
              </select>
            </F>
            <F label="University">
              <select value={form.university_id ?? ""} onChange={(e) => setForm({ ...form, university_id: e.target.value })} className="h-10 w-full rounded-md ring-1 ring-border px-3 text-sm bg-background">
                <option value="">—</option>
                {(us.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </F>
            <F label="Amount USD"><Input type="number" value={form.amount_usd ?? ""} onChange={(e) => setForm({ ...form, amount_usd: e.target.value })} /></F>
            <F label="Coverage"><Input value={form.coverage ?? ""} onChange={(e) => setForm({ ...form, coverage: e.target.value })} placeholder="Full tuition, partial, etc." /></F>
            <F label="Deadline"><Input type="date" value={form.deadline ?? ""} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></F>
            <F label="Apply URL"><Input value={form.apply_url ?? ""} onChange={(e) => setForm({ ...form, apply_url: e.target.value })} /></F>
            <div className="flex items-center justify-between rounded-md ring-1 ring-border px-3 py-2 sm:col-span-2"><span className="text-sm">Published</span><Switch checked={!!form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /></div>
          </div>
          <F label="Eligibility"><Textarea rows={3} value={form.eligibility ?? ""} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} /></F>
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
