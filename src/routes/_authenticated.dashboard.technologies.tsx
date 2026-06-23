import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { requireRolesOrRedirect, ROUTE_PERMISSIONS } from "@/lib/route-authorization";

export const Route = createFileRoute("/_authenticated/dashboard/technologies")({
  beforeLoad: ({ location }) => requireRolesOrRedirect(ROUTE_PERMISSIONS["/dashboard/technologies"], { location }),
  component: TechLayout,
});

const TABS = [
  { to: "/dashboard/technologies", label: "Overview", exact: true },
  { to: "/dashboard/technologies/projects", label: "Projects" },
  { to: "/dashboard/technologies/clients", label: "Clients" },
  { to: "/dashboard/technologies/proposals", label: "Proposals" },
  { to: "/dashboard/technologies/contracts", label: "Contracts" },
  { to: "/dashboard/technologies/finance", label: "Finance" },
  { to: "/dashboard/technologies/support", label: "Support" },
  { to: "/dashboard/technologies/requests", label: "Requests" },
] as const;

function TechLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">HIGAET Technologies</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clients, projects, milestones, and delivery operations.
        </p>
      </div>
      <div className="border-b border-border mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const active = (t as any).exact ? pathname === t.to : pathname.startsWith(t.to);
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
