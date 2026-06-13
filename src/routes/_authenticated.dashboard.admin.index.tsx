import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Users, ClipboardList, Award, Settings, Globe2, Cpu, Briefcase, MessagesSquare, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/")({
  component: AdminOverview,
});

const SECTIONS = [
  { to: "/dashboard/admin/programs", title: "Programs", desc: "Create and publish flagship programs, courses, lessons, and faculty assignments.", icon: GraduationCap, live: true },
  { to: "/dashboard/admin/users", title: "Users & Roles", desc: "Manage students, faculty, mentors, counsellors, and administrators.", icon: Users, live: true },
  { to: "/dashboard/admin/assignments", title: "Assignments", desc: "Author assignments across all courses (grading in Sprint 2C).", icon: ClipboardList, live: true },
  { to: "/dashboard/admin/certificates", title: "Certificates", desc: "Define per-program certificate templates (issuance in Sprint 2C).", icon: Award, live: true },
  { to: "/dashboard/admin/settings", title: "Settings", desc: "General platform configuration.", icon: Settings, live: true },
] as const;

const COMING_SOON = [
  { title: "Global Education Hub", desc: "Universities, applications, visa CRM, scholarships pipeline.", icon: Globe2 },
  { title: "HIGAET Technologies", desc: "SaaS catalog, client engagements, AI services delivery.", icon: Cpu },
  { title: "Placements", desc: "Job board, employer pipeline, student-job matching.", icon: Briefcase },
  { title: "Community", desc: "Cohorts, discussion threads, mentor circles, events.", icon: MessagesSquare },
  { title: "AI Services", desc: "AI tutor configuration, AI coach prompts, ops monitoring.", icon: Sparkles },
];

function AdminOverview() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-lg font-medium text-ink mb-3">Academy CMS</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className="group rounded-xl bg-card ring-1 ring-border p-5 hover:ring-academy/40 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-academy/10 text-academy grid place-items-center shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink group-hover:text-academy">{s.title}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-ink mb-3">HIGAET Ecosystem · Coming Soon</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMING_SOON.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="rounded-xl bg-muted/40 ring-1 ring-dashed ring-border p-5 opacity-70"
              >
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-muted text-muted-foreground grid place-items-center shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink flex items-center gap-2">
                      {s.title}
                      <span className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Soon</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
