import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminAnalytics } from "@/lib/academic.functions";
import { Users, GraduationCap, ClipboardCheck, Award, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fn = useServerFn(adminAnalytics);
  const q = useQuery({ queryKey: ["admin-analytics"], queryFn: () => fn() });
  const s = q.data;

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl font-medium text-ink">Academic analytics</h1>
      <p className="text-sm text-muted-foreground mt-1">High-level operational health of HIGAET Academy.</p>

      {q.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <Stat icon={Users} label="Enrollments (total)" value={s?.enrollments_total} sub={`${s?.enrollments_active} active`} />
          <Stat icon={Activity} label="Active students (30d)" value={s?.active_students_30d} />
          <Stat icon={GraduationCap} label="Completion rate" value={`${s?.completion_rate ?? 0}%`} sub={`${s?.enrollments_completed} completed`} />
          <Stat icon={ClipboardCheck} label="Submissions" value={s?.submissions_total} sub={`${s?.submissions_pending} pending · ${s?.submissions_passed} passed`} />
          <Stat icon={Award} label="Certificates issued" value={s?.certificates_issued} />
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: any; sub?: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <Icon className="size-5 text-academy" />
      <div className="font-display text-2xl font-medium text-ink mt-3">{value ?? "—"}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
