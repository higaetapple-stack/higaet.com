import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminArchiveJob, adminCreateJob, adminListEmployers, adminListJobs, adminUpdateJob } from "@/lib/career-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { SkillsInput } from "@/components/career/SkillsInput";
import { Plus, Pencil, Archive } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/jobs")({
  component: JobsAdmin,
});

const blank: any = {
  employer_id: "", title: "", slug: "", description: "", requirements: "", responsibilities: "",
  location: "", remote_type: "onsite", employment_type: "full_time", experience_level: "entry",
  salary_min: null, salary_max: null, salary_currency: "INR", skills: [], apply_url: "", status: "draft",
};

function JobsAdmin() {
  const list = useServerFn(adminListJobs);
  const emps = useServerFn(adminListEmployers);
  const create = useServerFn(adminCreateJob);
  const update = useServerFn(adminUpdateJob);
  const arch = useServerFn(adminArchiveJob);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["admin-jobs"], queryFn: () => list() });
  const eq = useQuery({ queryKey: ["admin-employers"], queryFn: () => emps() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank);

  const start = (row?: any) => {
    setEditing(row ?? null);
    setForm(row ? { ...blank, ...row } : blank);
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      payload.salary_min = payload.salary_min === "" || payload.salary_min == null ? null : Number(payload.salary_min);
      payload.salary_max = payload.salary_max === "" || payload.salary_max == null ? null : Number(payload.salary_max);
      if (editing) return update({ data: { id: editing.id, ...payload } });
      return create({ data: payload });
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-jobs"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: (id: string) => arch({ data: { id } }),
    onSuccess: () => { toast.success("Archived"); qc.invalidateQueries({ queryKey: ["admin-jobs"] }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink">Job postings</h2>
        <Button onClick={() => start()} className="bg-academy text-academy-foreground hover:bg-academy/90"><Plus className="size-4" /> New job</Button>
      </div>

      <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        {(q.data ?? []).map((j: any) => (
          <li key={j.id} className="p-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink">{j.title}</div>
              <div className="text-xs text-muted-foreground">{j.employers?.name} · {j.location ?? j.remote_type} · /{j.slug}</div>
            </div>
            <Badge className="capitalize">{j.status}</Badge>
            <Button size="sm" variant="ghost" onClick={() => start(j)}><Pencil className="size-3.5" /></Button>
            {j.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => archive.mutate(j.id)}><Archive className="size-3.5" /></Button>}
          </li>
        ))}
        {(q.data ?? []).length === 0 && <li className="p-6 text-sm text-muted-foreground text-center">No jobs yet.</li>}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit job" : "New job"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Employer">
                <Select value={form.employer_id} onValueChange={(v) => setForm({ ...form, employer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {(eq.data ?? []).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="(auto)" /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft","open","closed","archived"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
              <Field label="Remote type">
                <Select value={form.remote_type} onValueChange={(v) => setForm({ ...form, remote_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["onsite","hybrid","remote"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Employment">
                <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["full_time","part_time","contract","internship"].map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Experience level">
                <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["entry","mid","senior"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Salary min"><Input type="number" value={form.salary_min ?? ""} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} /></Field>
              <Field label="Salary max"><Input type="number" value={form.salary_max ?? ""} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} /></Field>
              <Field label="Currency"><Input value={form.salary_currency} onChange={(e) => setForm({ ...form, salary_currency: e.target.value })} /></Field>
              <Field label="External apply URL"><Input value={form.apply_url} onChange={(e) => setForm({ ...form, apply_url: e.target.value })} placeholder="Optional" /></Field>
            </div>
            <Field label="Description"><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Responsibilities"><Textarea rows={4} value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} /></Field>
            <Field label="Requirements"><Textarea rows={4} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></Field>
            <Field label="Skills"><SkillsInput value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} /></Field>
          </div>
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
