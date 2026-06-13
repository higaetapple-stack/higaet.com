import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: AdminLayout,
});

type Tab = {
  to:
    | "/dashboard/admin"
    | "/dashboard/admin/programs"
    | "/dashboard/admin/users"
    | "/dashboard/admin/assignments"
    | "/dashboard/admin/certificates"
    | "/dashboard/admin/settings";
  label: string;
  exact?: boolean;
};

const TABS: Tab[] = [
  { to: "/dashboard/admin", label: "Overview", exact: true },
  { to: "/dashboard/admin/programs", label: "Programs" },
  { to: "/dashboard/admin/users", label: "Users & Roles" },
  { to: "/dashboard/admin/assignments", label: "Assignments" },
  { to: "/dashboard/admin/certificates", label: "Certificates" },
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
                to={t.to}
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
