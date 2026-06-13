import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyCareerProfile, listMyApplications } from "@/lib/career.functions";
import { Briefcase, FileText, Globe, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/career/")({
  component: CareerOverview,
});

function CareerOverview() {
  const fp = useServerFn(getMyCareerProfile);
  const fa = useServerFn(listMyApplications);
  const profile = useQuery({ queryKey: ["my-career-profile"], queryFn: () => fp() });
  const apps = useQuery({ queryKey: ["my-applications"], queryFn: () => fa() });

  const p: any = profile.data;
  const visibility = p?.portfolio_visibility ?? "private";
  const slug = p?.portfolio_slug;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Applications" value={apps.data?.length ?? 0} icon={Briefcase} to="/dashboard/career/applications" />
        <Stat label="Portfolio" value={visibility} icon={Globe} to="/dashboard/career/portfolio" />
        <Stat label="Resume" value="Ready" icon={FileText} to="/dashboard/career/resume" />
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-border p-6">
        <h2 className="font-display text-lg font-medium text-ink">Get hired through HIGAET</h2>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal pl-5">
          <li>Complete your <Link to="/dashboard/career/profile" className="text-academy">Career profile</Link> — skills, experience, education, goals.</li>
          <li>Publish your <Link to="/dashboard/career/portfolio" className="text-academy">Portfolio</Link> to share with recruiters.</li>
          <li>Export your <Link to="/dashboard/career/resume" className="text-academy">Resume</Link> as PDF — auto-built from your HIGAET record.</li>
          <li>Browse the <Link to="/jobs" className="text-academy">Job board</Link> and apply with one click.</li>
        </ol>
      </div>

      {slug && visibility !== "private" && (
        <div className="rounded-2xl bg-academy/5 ring-1 ring-academy/20 p-5">
          <div className="text-xs uppercase tracking-wider text-academy">Your portfolio is {visibility}</div>
          <Link to="/portfolio/$slug" params={{ slug }} className="font-mono text-sm text-ink mt-1 inline-block">
            /portfolio/{slug} <ArrowRight className="size-3.5 inline" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, to }: any) {
  return (
    <Link to={to} className="rounded-2xl bg-card ring-1 ring-border p-5 hover:ring-academy/40 transition block">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl text-ink mt-1 capitalize">{value}</div>
        </div>
        <Icon className="size-5 text-academy" />
      </div>
    </Link>
  );
}
