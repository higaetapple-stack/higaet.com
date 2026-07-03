import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { createVisaCase, listVisaCases, visaKpis } from "@/lib/visa.functions";
import { studyAbroadEvents } from "@/lib/analytics-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dashboard/admin/visa")({
  component: AdminVisa,
});

const STATUSES = [
  "",
  "draft",
  "documents_pending",
  "ready_to_submit",
  "submitted",
  "interview_scheduled",
  "administrative_processing",
  "approved",
  "rejected",
  "closed",
];

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="ring-1 ring-border rounded-2xl bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-ink mt-1">{value}</div>
    </div>
  );
}

function AdminVisa() {
  const list = useServerFn(listVisaCases);
  const kpi = useServerFn(visaKpis);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const kpis = useQuery({ queryKey: ["visa-kpis"], queryFn: () => kpi({ data: {} }) });
  const cases = useQuery({
    queryKey: ["visa-list", status, q],
    queryFn: () => list({ data: { status: (status || undefined) as any, q: q || undefined } }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="font-display text-xl font-medium text-ink">Visa operations</h2>
        <NewVisaCaseDialog />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Kpi label="Open" value={kpis.data?.open ?? 0} />
        <Kpi label="Docs pending" value={kpis.data?.documents_pending ?? 0} />
        <Kpi label="Submitted" value={kpis.data?.submitted ?? 0} />
        <Kpi label="Interview" value={kpis.data?.interview_scheduled ?? 0} />
        <Kpi label="Approved" value={kpis.data?.approved ?? 0} />
        <Kpi label="Rejected" value={kpis.data?.rejected ?? 0} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search student…"
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Country</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Interview</th>
              <th className="p-3">Counselor</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {cases.isLoading && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {(cases.data ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">
                  <div className="text-ink font-medium">{c.student?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{c.student?.email}</div>
                </td>
                <td className="p-3 text-xs">
                  {c.countries?.flag_emoji} {c.countries?.name ?? "—"}
                </td>
                <td className="p-3 text-xs">{c.visa_type ?? "—"}</td>
                <td className="p-3 text-xs">{c.status}</td>
                <td className="p-3 text-xs">{c.interview_date ?? "—"}</td>
                <td className="p-3 text-xs">{c.counselor?.full_name ?? "—"}</td>
                <td className="p-3 text-right">
                  <Link
                    to="/dashboard/admin/visa/$id"
                    params={{ id: c.id }}
                    className="text-academy text-xs font-medium hover:underline"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
            {!cases.isLoading && (cases.data ?? []).length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No visa cases.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewVisaCaseDialog() {
  const create = useServerFn(createVisaCase);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [visaType, setVisaType] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      if (!studentId.trim()) throw new Error("Student ID is required");
      return create({
        data: {
          student_id: studentId.trim(),
          application_id: applicationId.trim() || undefined,
          country_id: countryId.trim() || undefined,
          visa_type: visaType.trim() || undefined,
        },
      });
    },
    onSuccess: (row) => {
      studyAbroadEvents.visaCaseCreated({
        case_id: row.id,
        country: countryId.trim() || undefined,
      });
      toast.success("Visa case created");
      qc.invalidateQueries({ queryKey: ["visa-list"] });
      qc.invalidateQueries({ queryKey: ["visa-kpis"] });
      setOpen(false);
      setStudentId("");
      setApplicationId("");
      setCountryId("");
      setVisaType("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New visa case</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create visa case</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="v-student">Student user ID (UUID)</Label>
            <Input id="v-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="v-app">Application ID</Label>
              <Input id="v-app" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} placeholder="optional" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="v-country">Country ID</Label>
              <Input id="v-country" value={countryId} onChange={(e) => setCountryId(e.target.value)} placeholder="optional" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="v-type">Visa type</Label>
            <Input id="v-type" value={visaType} onChange={(e) => setVisaType(e.target.value)} placeholder="e.g. F-1, Tier 4" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mut.isPending}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Creating…" : "Create case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
