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
import { adminListUniversities, adminSaveUniversity, adminDeleteUniversity, adminListCountries } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/universities")({
  component: UniAdmin,
});

const blank: any = { name: "", slug: "", country_id: "", city: "", overview: "", description: "", world_ranking: "", avg_tuition_usd: "", website_url: "", hero_image_url: "", featured: false, published: true };

function UniAdmin() {
  const list = useServerFn(adminListUniversities);
  const listC = useServerFn(adminListCountries);
  const save = useServerFn(adminSaveUniversity);
  const del = useServerFn(adminDeleteUniversity);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-unis"], queryFn: () => list() });
  const cs = useQuery({ queryKey: ["admin-countries"], queryFn: () => listC() });
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank);
  const [open, setOpen] = useState(false);
  const start = (r?: any) => { setEditing(r ?? null); setForm(r ? { ...blank, ...r, country_id: r.country_id ?? "" } : blank); setOpen(true); };
  const m = useMutation({
    mutationFn: () => save({ data: editing ? { id: editing.id, ...form, country_id: form.country_id || undefined } : { ...form, country_id: form.country_id || undefined } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-unis"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rm = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-unis"] }); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink">Universities</h2>
        <Button onClick={() => start()} className="bg-global text-white hover:bg-global/90"><Plus className="size-4" /> New</Button>
      </div>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
          {(q.data ?? []).map((u: any) => (
            <li key={u.id} className="p-4 flex items-center gap-3">
              <div className="text-xl">{u.countries?.flag_emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{u.name} {u.featured && <span className="text-[10px] bg-global/10 text-global px-1 rounded">Featured</span>}</div>
                <div className="text-xs text-muted-foreground">{u.countries?.name} · {u.city} · /{u.slug}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => start(u)}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && rm.mutate(u.id)}><Trash2 className="size-3.5" /></Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit university" : "New university"}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <F label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
            <F label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="(auto)" /></F>
            <F label="Country">
              <select value={form.country_id ?? ""} onChange={(e) => setForm({ ...form, country_id: e.target.value })} className="h-10 w-full rounded-md ring-1 ring-border px-3 text-sm bg-background">
                <option value="">— none —</option>
                {(cs.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
              </select>
            </F>
            <F label="City"><Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></F>
            <F label="World ranking"><Input type="number" value={form.world_ranking ?? ""} onChange={(e) => setForm({ ...form, world_ranking: e.target.value })} /></F>
            <F label="Avg tuition USD"><Input type="number" value={form.avg_tuition_usd ?? ""} onChange={(e) => setForm({ ...form, avg_tuition_usd: e.target.value })} /></F>
            <F label="Website"><Input value={form.website_url ?? ""} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></F>
            <F label="Hero image URL"><Input value={form.hero_image_url ?? ""} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} /></F>
            <div className="flex items-center justify-between rounded-md ring-1 ring-border px-3 py-2"><span className="text-sm">Featured</span><Switch checked={!!form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /></div>
            <div className="flex items-center justify-between rounded-md ring-1 ring-border px-3 py-2"><span className="text-sm">Published</span><Switch checked={!!form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /></div>
          </div>
          <F label="Overview"><Textarea rows={2} value={form.overview ?? ""} onChange={(e) => setForm({ ...form, overview: e.target.value })} /></F>
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
