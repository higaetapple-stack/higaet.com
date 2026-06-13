import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/counselor")({
  component: CounselorLayout,
});

const TABS = [
  { to: "/dashboard/counselor", label: "Overview", exact: true },
  { to: "/dashboard/counselor/leads", label: "My leads" },
  { to: "/dashboard/counselor/applications", label: "My applications" },
  { to: "/dashboard/counselor/tasks", label: "Tasks" },
  { to: "/dashboard/counselor/follow-ups", label: "Follow-ups" },
] as const;

function CounselorLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">Counselor workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Study-abroad leads, applications, tasks, and follow-ups assigned to you.
        </p>
      </div>
      <div className="border-b border-border mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
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
