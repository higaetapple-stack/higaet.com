import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminAnalytics } from "@/lib/academic.functions";
import {
  Users, GraduationCap, ClipboardCheck, Award, Activity,
  Briefcase, Building2, FileText, Globe2, Rocket, BookOpen, Trophy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fn = useServerFn(adminAnalytics);
  const q = useQuery({ queryKey: ["admin-analytics"], queryFn: () => fn() });
  const s = q.data;

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-2xl font-medium text-ink">HIGAET executive analytics</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Operational health across Academy, engagement, career, and placements.
      </p>

      {q.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-8 mt-8">
          <Section title="Academy">
            <Stat icon={Users} label="Students registered" value={s?.students_total} />
            <Stat icon={Activity} label="Active students (30d)" value={s?.active_students_30d} />
            <Stat icon={GraduationCap} label="Enrollments" value={s?.enrollments_total} sub={`${s?.enrollments_active} active`} />
            <Stat icon={GraduationCap} label="Programs completed" value={s?.enrollments_completed} />
            <Stat icon={Award} label="Certificates issued" value={s?.certificates_issued} />
            <Stat icon={Activity} label="Completion rate" value={`${s?.completion_rate ?? 0}%`} />
          </Section>

          <Section title="Engagement">
            <Stat icon={BookOpen} label="Lessons completed" value={s?.lessons_completed_total} />
            <Stat icon={ClipboardCheck} label="Assignments submitted" value={s?.submissions_total} sub={`${s?.submissions_pending} pending · ${s?.submissions_passed} passed`} />
            <Stat icon={Rocket} label="Projects submitted" value={s?.project_submissions_total} />
          </Section>

          <Section title="Career">
            <Stat icon={Globe2} label="Public portfolios" value={s?.public_portfolios} />
            <Stat icon={Building2} label="Employers" value={s?.employers_total} />
            <Stat icon={Briefcase} label="Jobs posted" value={s?.jobs_total} sub={`${s?.jobs_open} open`} />
            <Stat icon={FileText} label="Applications submitted" value={s?.applications_total} />
            <Stat icon={Activity} label="Applications per open job" value={s?.applications_per_job} />
          </Section>

          <Section title="Placements">
            <Stat icon={Trophy} label="Placements recorded" value={s?.placements_total} />
            <Stat icon={Trophy} label="Verified placements" value={s?.placements_verified} />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">{title}</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
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
