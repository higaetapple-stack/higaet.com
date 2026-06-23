import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { requireRolesOrRedirect, ROUTE_PERMISSIONS } from "@/lib/route-authorization";

export const Route = createFileRoute("/_authenticated/dashboard/career")({
  beforeLoad: ({ location }) => requireRolesOrRedirect(ROUTE_PERMISSIONS["/dashboard/career"], { location }),
  component: CareerLayout,
});

const TABS: { to: any; label: string; exact?: boolean }[] = [
  { to: "/dashboard/career", label: "Overview", exact: true },
  { to: "/dashboard/career/profile", label: "Profile" },
  { to: "/dashboard/career/portfolio", label: "Portfolio" },
  { to: "/dashboard/career/resume", label: "Resume" },
  { to: "/dashboard/career/applications", label: "Applications" },
  { to: "/dashboard/career/saved", label: "Saved jobs" },
];

function CareerLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">Career hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Profile, resume, portfolio, and job applications.</p>
      </div>
      <div className="border-b border-border mb-6 -mx-2 overflow-x-auto">
        <nav className="flex gap-1 px-2 min-w-max">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px transition-colors",
                  active ? "border-academy text-academy font-medium" : "border-transparent text-muted-foreground hover:text-ink",
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
