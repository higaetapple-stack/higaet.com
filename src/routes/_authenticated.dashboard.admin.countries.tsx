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
import { adminListCountries, adminSaveCountry, adminDeleteCountry } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/countries")({
  component: CountriesAdmin,
});

const blank: any = { name: "", slug: "", iso_code: "", flag_emoji: "", summary: "", description: "", currency: "", primary_language: "", avg_tuition_usd: "", display_order: 0, published: true };

function CountriesAdmin() {
  const list = useServerFn(adminListCountries);
  const save = useServerFn(adminSaveCountry);
  const del = useServerFn(adminDeleteCountry);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-countries"], queryFn: () => list() });
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank);
  const [open, setOpen] = useState(false);

  const start = (r?: any) => { setEditing(r ?? null); setForm(r ? { ...blank, ...r } : blank); setOpen(true); };
  const m = useMutation({
    mutationFn: () => save({ data: editing ? { id: editing.id, ...form } : form }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-countries"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rm = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-countries"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink">Countries</h2>
        <Button onClick={() => start()} className="bg-global text-white hover:bg-global/90"><Plus className="size-4" /> New country</Button>
      </div>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
          {(q.data ?? []).map((c: any) => (
            <li key={c.id} className="p-4 flex items-center gap-3">
              <div className="text-2xl">{c.flag_emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{c.name}</div>
                <div className="text-xs text-muted-foreground">/{c.slug} · #{c.display_order} {!c.published && "· hidden"}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => start(c)}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && rm.mutate(c.id)}><Trash2 className="size-3.5" /></Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit country" : "New country"}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <F label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
            <F label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="(auto)" /></F>
            <F label="ISO code"><Input value={form.iso_code} onChange={(e) => setForm({ ...form, iso_code: e.target.value })} /></F>
            <F label="Flag emoji"><Input value={form.flag_emoji} onChange={(e) => setForm({ ...form, flag_emoji: e.target.value })} /></F>
            <F label="Currency"><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></F>
            <F label="Language"><Input value={form.primary_language} onChange={(e) => setForm({ ...form, primary_language: e.target.value })} /></F>
            <F label="Avg tuition USD"><Input type="number" value={form.avg_tuition_usd ?? ""} onChange={(e) => setForm({ ...form, avg_tuition_usd: e.target.value })} /></F>
            <F label="Display order"><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></F>
            <div className="flex items-center justify-between rounded-md ring-1 ring-border px-3 py-2 sm:col-span-2">
              <span className="text-sm">Published</span>
              <Switch checked={!!form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
            </div>
          </div>
          <F label="Summary"><Textarea rows={2} value={form.summary ?? ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></F>
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
