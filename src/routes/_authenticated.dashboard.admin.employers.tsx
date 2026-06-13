import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminCreateEmployer, adminDeleteEmployer, adminListEmployers, adminUpdateEmployer } from "@/lib/career-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/employers")({
  component: EmployersAdmin,
});

const blank = { name: "", slug: "", website: "", logo_url: "", description: "", industry: "", hq_location: "", size: "", verified: false };

function EmployersAdmin() {
  const list = useServerFn(adminListEmployers);
  const create = useServerFn(adminCreateEmployer);
  const update = useServerFn(adminUpdateEmployer);
  const del = useServerFn(adminDeleteEmployer);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-employers"], queryFn: () => list() });

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank);
  const [open, setOpen] = useState(false);

  const start = (row?: any) => {
    setEditing(row ?? null);
    setForm(row ? { ...blank, ...row } : blank);
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editing) return update({ data: { id: editing.id, ...form } });
      return create({ data: form });
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-employers"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-employers"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink">Employers</h2>
        <Button onClick={() => start()} className="bg-academy text-academy-foreground hover:bg-academy/90"><Plus className="size-4" /> New employer</Button>
      </div>

      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border overflow-hidden">
          {(q.data ?? []).map((e: any) => (
            <li key={e.id} className="p-4 flex items-center gap-3">
              <div className="size-10 rounded bg-muted overflow-hidden grid place-items-center shrink-0">
                {e.logo_url ? <img src={e.logo_url} alt={e.name} className="size-full object-cover" /> : <span className="text-xs">{e.name.charAt(0)}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink flex items-center gap-1">{e.name} {e.verified && <BadgeCheck className="size-3.5 text-academy" />}</div>
                <div className="text-xs text-muted-foreground truncate">{e.industry} · {e.hq_location} · /{e.slug}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => start(e)}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => confirm("Delete employer?") && remove.mutate(e.id)}><Trash2 className="size-3.5" /></Button>
            </li>
          ))}
          {(q.data ?? []).length === 0 && <li className="p-6 text-sm text-muted-foreground text-center">No employers yet.</li>}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit employer" : "New employer"}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="(auto)" /></Field>
            <Field label="Website"><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
            <Field label="Logo URL"><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></Field>
            <Field label="Industry"><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></Field>
            <Field label="HQ location"><Input value={form.hq_location} onChange={(e) => setForm({ ...form, hq_location: e.target.value })} /></Field>
            <Field label="Size"><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="1–10, 50–200…" /></Field>
            <div className="flex items-center justify-between rounded-md ring-1 ring-border px-3 py-2">
              <span className="text-sm">Verified</span>
              <Switch checked={!!form.verified} onCheckedChange={(v) => setForm({ ...form, verified: v })} />
            </div>
          </div>
          <Field label="Description"><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <DialogFooter>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-academy text-academy-foreground hover:bg-academy/90">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><Label className="text-xs">{label}</Label><div className="mt-1.5">{children}</div></div>;
}
