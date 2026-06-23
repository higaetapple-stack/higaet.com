import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { requireRolesOrRedirect, ROUTE_PERMISSIONS } from "@/lib/route-authorization";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  beforeLoad: () => requireRolesOrRedirect(ROUTE_PERMISSIONS["/dashboard/admin"]),
  component: AdminLayout,
});

type Tab = {
  to: string;
  label: string;
  exact?: boolean;
  group?: string;
};

const TABS: Tab[] = [
  { to: "/dashboard/admin", label: "Overview", exact: true },
  { to: "/dashboard/admin/crm", label: "CRM", group: "Operations" },
  { to: "/dashboard/admin/programs", label: "Programs", group: "Academy" },
  { to: "/dashboard/admin/projects", label: "Projects", group: "Academy" },
  { to: "/dashboard/admin/enrollments", label: "Enrollments", group: "Academy" },
  { to: "/dashboard/admin/assignments", label: "Assignments", group: "Academy" },
  { to: "/dashboard/admin/certificates", label: "Certificates", group: "Academy" },
  { to: "/dashboard/admin/employers", label: "Employers", group: "Career" },
  { to: "/dashboard/admin/jobs", label: "Jobs", group: "Career" },
  { to: "/dashboard/admin/applications", label: "Job apps", group: "Career" },
  { to: "/dashboard/admin/placements", label: "Placements", group: "Career" },
  { to: "/dashboard/admin/stories", label: "Stories", group: "Career" },
  { to: "/dashboard/admin/countries", label: "Countries", group: "Global" },
  { to: "/dashboard/admin/universities", label: "Universities", group: "Global" },
  { to: "/dashboard/admin/uniprograms", label: "Uni programs", group: "Global" },
  { to: "/dashboard/admin/scholarships", label: "Scholarships", group: "Global" },
  { to: "/dashboard/admin/sa-leads", label: "SA leads", group: "Global" },
  { to: "/dashboard/admin/sa-applications", label: "SA apps", group: "Global" },
  { to: "/dashboard/admin/visa", label: "Visa", group: "Global" },
  { to: "/dashboard/admin/tech-leads", label: "Tech leads", group: "Tech" },
  { to: "/dashboard/admin/users", label: "Users & Roles" },
  { to: "/dashboard/admin/observability", label: "Observability" },
  { to: "/dashboard/admin/rag", label: "RAG pipeline" },
  { to: "/dashboard/admin/ai/usage", label: "AI usage" },
  { to: "/dashboard/admin/api", label: "Public API" },
  { to: "/dashboard/admin/webhooks", label: "Webhooks" },
  { to: "/dashboard/admin/analytics", label: "Analytics" },
  { to: "/dashboard/admin/settings", label: "Settings" },
];


function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">HIGAET Control Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Academy CMS · Programs, courses, lessons, faculty, and users.
        </p>
      </div>
      <div className="border-b border-border mb-6 -mx-2 overflow-x-auto">
        <nav className="flex gap-1 px-2 min-w-max">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to as any}
                className={cn(
                  "px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px transition-colors",
                  active
                    ? "border-academy text-academy font-medium"
                    : "border-transparent text-muted-foreground hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
