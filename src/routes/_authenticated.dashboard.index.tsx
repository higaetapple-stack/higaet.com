import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, GraduationCap, Award, ClipboardCheck, BookOpen, PlayCircle } from "lucide-react";
import { getMyProfile } from "@/lib/auth.functions";
import { getDashboardSummary } from "@/lib/learn.functions";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchSummary = useServerFn(getDashboardSummary);
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const summary = useQuery({ queryKey: ["dashboard-summary"], queryFn: () => fetchSummary() });

  const name = profile.data?.full_name?.split(" ")[0] || "there";
  const stats = summary.data?.stats;
  const continueSlug = summary.data?.continue_program_slug;

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-medium text-ink">Welcome back, {name}.</h1>
      <p className="text-muted-foreground mt-2">
        Your HIGAET learning hub. Continue where you left off or explore new programs.
      </p>

      <div className="grid gap-4 sm:grid-cols-4 mt-8">
        <Stat icon={GraduationCap} label="Programs" value={String(stats?.programs_enrolled ?? 0)} />
        <Stat icon={ClipboardCheck} label="Lessons done" value={String(stats?.lessons_completed ?? 0)} />
        <Stat icon={Award} label="Certificates" value={String(stats?.certificates_earned ?? 0)} />
        <Stat icon={BookOpen} label="Assignments pending" value={String(stats?.assignments_pending ?? 0)} />
      </div>

      <section className="mt-8 rounded-2xl bg-card ring-1 ring-border p-6">
        <h2 className="font-display text-lg font-medium text-ink">Continue learning</h2>
        {continueSlug ? (
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">Pick up your most recent program.</p>
            <Link
              to="/dashboard/programs/$slug"
              params={{ slug: continueSlug }}
              className="inline-flex items-center gap-2 bg-academy text-academy-foreground text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90"
            >
              <PlayCircle className="size-4" /> Continue
            </Link>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">You're not enrolled in a program yet.</p>
            <Link
              to="/academy/programs"
              className="inline-flex items-center gap-2 bg-academy text-academy-foreground text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90"
            >
              Browse programs <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <section className="rounded-2xl bg-card ring-1 ring-border p-6">
          <h2 className="font-display text-lg font-medium text-ink">Recent activity</h2>
          <ul className="mt-3 divide-y divide-border">
            {(summary.data?.recent_activity ?? []).length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">No activity yet. Complete a lesson to see it here.</li>
            )}
            {summary.data?.recent_activity?.map((a, i) => (
              <li key={i} className="py-2.5 text-sm">
                <div className="text-ink">{a.lesson_title ?? "Lesson"}</div>
                <div className="text-xs text-muted-foreground">
                  {a.course_title ?? ""} {a.completed_at && `· ${new Date(a.completed_at).toLocaleDateString()}`}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-card ring-1 ring-border p-6">
          <h2 className="font-display text-lg font-medium text-ink">My programs</h2>
          <ul className="mt-3 space-y-2">
            {(summary.data?.enrolled_programs ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground">No enrolments yet.</li>
            )}
            {summary.data?.enrolled_programs?.map((p: any) => (
              <li key={p.id}>
                <Link
                  to="/dashboard/programs/$slug"
                  params={{ slug: p.slug }}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted text-sm"
                >
                  <span className="text-ink truncate">{p.title}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof GraduationCap; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card ring-1 ring-border p-5">
      <Icon className="size-5 text-academy" />
      <div className="font-display text-2xl font-medium text-ink mt-3">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
