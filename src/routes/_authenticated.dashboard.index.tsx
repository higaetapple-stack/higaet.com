import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, GraduationCap, Award, ClipboardCheck } from "lucide-react";
import { getMyProfile, getMyRoles } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchRoles = useServerFn(getMyRoles);
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });
  const roles = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });

  const name = profile.data?.full_name?.split(" ")[0] || "there";

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-medium text-ink">Welcome back, {name}.</h1>
      <p className="text-muted-foreground mt-2">
        This is your HIGAET dashboard. Programs, progress, and certificates will appear here as you enrol.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mt-10">
        <Stat icon={GraduationCap} label="Enrolled programs" value="0" />
        <Stat icon={ClipboardCheck} label="Lessons completed" value="0" />
        <Stat icon={Award} label="Certificates" value="0" />
      </div>

      <section className="mt-10 rounded-xl bg-card ring-1 ring-border p-6">
        <h2 className="font-display text-lg font-medium text-ink">Get started</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore HIGAET programs, then apply to enrol in a cohort.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/academy/programs"
            className="inline-flex items-center gap-2 bg-academy text-white text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
          >
            Browse programs <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/academy/admissions"
            className="inline-flex items-center gap-2 ring-1 ring-border text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors"
          >
            Talk to admissions
          </Link>
        </div>
      </section>

      {roles.data && roles.data.length > 0 && (
        <p className="text-xs text-muted-foreground mt-6">
          Signed in with role{roles.data.length === 1 ? "" : "s"}: {roles.data.join(", ")}.
        </p>
      )}
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
