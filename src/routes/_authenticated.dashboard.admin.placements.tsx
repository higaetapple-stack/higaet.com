import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminListPlacements,
  adminUpsertPlacement,
  adminDeletePlacement,
  adminSearchStudents,
} from "@/lib/placements.functions";
import { adminListEmployers } from "@/lib/career-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/placements")({
  component: PlacementsAdmin,
});

const blank: any = {
  student_id: "",
  employer_id: null,
  program_id: null,
  job_posting_id: null,
  job_title: "",
  salary_package: null,
  salary_currency: "INR",
  employment_type: "full_time",
  offer_date: "",
  joining_date: "",
  status: "offered",
  verified: false,
  notes: "",
};

function PlacementsAdmin() {
  const list = useServerFn(adminListPlacements);
  const save = useServerFn(adminUpsertPlacement);
  const del = useServerFn(adminDeletePlacement);
  const search = useServerFn(adminSearchStudents);
  const employersList = useServerFn(adminListEmployers);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["admin-placements"], queryFn: () => list() });
  const employers = useQuery({ queryKey: ["admin-employers"], queryFn: () => employersList() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank);
  const [studentQ, setStudentQ] = useState("");
  const students = useQuery({
    queryKey: ["student-search", studentQ],
    queryFn: () => search({ data: { q: studentQ } }),
    enabled: open,
  });

  const start = (row?: any) => {
    setEditing(row ?? null);
    setForm(
      row
        ? {
            ...blank,
            ...row,
            offer_date: row.offer_date ?? "",
            joining_date: row.joining_date ?? "",
            notes: row.notes ?? "",
            salary_package: row.salary_package ?? null,
          }
        : blank,
    );
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (!payload.salary_package) payload.salary_package = null;
      if (!payload.offer_date) payload.offer_date = null;
      if (!payload.joining_date) payload.joining_date = null;
      for (const k of ["employer_id", "program_id", "job_posting_id"]) {
        if (!payload[k]) payload[k] = null;
      }
      if (editing) payload.id = editing.id;
      return save({ data: payload });
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-placements"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-placements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-medium text-ink">Placements</h2>
        <Button onClick={() => start()} className="bg-academy text-academy-foreground hover:bg-academy/90">
          <Plus className="size-4" /> New placement
        </Button>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-border overflow-hidden">
          {(q.data ?? []).map((p: any) => (
            <li key={p.id} className="p-4 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink flex items-center gap-1">
                  {p.profiles?.full_name ?? "—"} → {p.employers?.name ?? "—"}
                  {p.verified && <BadgeCheck className="size-3.5 text-academy" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.job_title} · {p.employment_type} · {p.status}
                  {p.salary_package && ` · ${p.salary_currency} ${p.salary_package}`}
                  {p.offer_date && ` · offer ${p.offer_date}`}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => start(p)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => confirm("Delete placement?") && remove.mutate(p.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
          {(q.data ?? []).length === 0 && (
            <li className="p-6 text-sm text-muted-foreground text-center">No placements yet.</li>
          )}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit placement" : "New placement"}</DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Student">
              <Input
                placeholder="Search by name or email…"
                value={studentQ}
                onChange={(e) => setStudentQ(e.target.value)}
              />
              <select
                className="mt-1.5 w-full rounded-md ring-1 ring-border bg-background px-3 py-2 text-sm"
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              >
                <option value="">— select student —</option>
                {(students.data ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.email} ({s.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Employer">
              <select
                className="w-full rounded-md ring-1 ring-border bg-background px-3 py-2 text-sm"
                value={form.employer_id ?? ""}
                onChange={(e) => setForm({ ...form, employer_id: e.target.value || null })}
              >
                <option value="">— none —</option>
                {(employers.data ?? []).map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Job title">
              <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
            </Field>
            <Field label="Employment type">
              <select
                className="w-full rounded-md ring-1 ring-border bg-background px-3 py-2 text-sm"
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </Field>
            <Field label="Package">
              <Input
                type="number"
                value={form.salary_package ?? ""}
                onChange={(e) =>
                  setForm({ ...form, salary_package: e.target.value ? Number(e.target.value) : null })
                }
              />
            </Field>
            <Field label="Currency">
              <Input
                value={form.salary_currency}
                onChange={(e) => setForm({ ...form, salary_currency: e.target.value })}
              />
            </Field>
            <Field label="Offer date">
              <Input
                type="date"
                value={form.offer_date ?? ""}
                onChange={(e) => setForm({ ...form, offer_date: e.target.value })}
              />
            </Field>
            <Field label="Joining date">
              <Input
                type="date"
                value={form.joining_date ?? ""}
                onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className="w-full rounded-md ring-1 ring-border bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="offered">Offered</option>
                <option value="accepted">Accepted</option>
                <option value="joined">Joined</option>
                <option value="declined">Declined</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </Field>
            <div className="flex items-center justify-between rounded-md ring-1 ring-border px-3 py-2">
              <span className="text-sm">Verified</span>
              <Switch checked={!!form.verified} onCheckedChange={(v) => setForm({ ...form, verified: v })} />
            </div>
          </div>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || !form.student_id || !form.job_title}
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

function Field({ label, children }: any) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
