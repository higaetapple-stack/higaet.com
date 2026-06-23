import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { requireRolesOrRedirect, ROUTE_PERMISSIONS } from "@/lib/route-authorization";

export const Route = createFileRoute("/_authenticated/education")({
  beforeLoad: ({ location }) => requireRolesOrRedirect(ROUTE_PERMISSIONS["/education"], { location }),
  component: EducationLayout,
});

const TABS = [
  { to: "/education", label: "Overview" },
  { to: "/education/profile", label: "Profile" },
  { to: "/education/applications", label: "Applications" },
  { to: "/education/documents", label: "Documents" },
] as const;

function EducationLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium text-ink">Global Education Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your study-abroad journey — profile, applications, documents, and counsellor activity.
        </p>
      </header>
      <nav className="flex flex-wrap gap-1 border-b border-border mb-6">
        {TABS.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`px-3 py-2 text-sm rounded-t-md -mb-px border-b-2 ${
                active
                  ? "border-global text-ink font-medium"
                  : "border-transparent text-muted-foreground hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
