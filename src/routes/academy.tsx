import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { cn } from "@/lib/utils";

const ACADEMY_NAV = [
  { to: "/academy", label: "Overview", exact: true },
  { to: "/academy/programs", label: "Programs" },
  { to: "/academy/campuses", label: "Campuses" },
  { to: "/academy/scholarship", label: "Scholarship (HAT)" },
  { to: "/academy/placements", label: "Placements" },
  { to: "/academy/corporate-training", label: "Corporate" },
  { to: "/academy/success-stories", label: "Stories" },
  { to: "/academy/faq", label: "FAQ" },
  { to: "/academy/contact", label: "Contact" },
] as const;

export const Route = createFileRoute("/academy")({
  component: AcademyLayout,
});

function AcademyLayout() {
  return (
    <SiteShell>
      <div data-brand="academy">
        <AcademyNav />
        <Outlet />
      </div>
    </SiteShell>
  );
}

function AcademyNav() {
  return (
    <div className="border-b border-border bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between gap-4 py-3 overflow-x-auto">
          <Link to="/academy" className="font-display text-sm font-medium text-ink shrink-0 pr-4 border-r border-border">
            <span className="text-academy">●</span> HIGAET Academy
          </Link>
          <ul className="flex items-center gap-1 text-sm font-medium text-muted-foreground whitespace-nowrap">
            {ACADEMY_NAV.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={cn(
                    "px-3 py-1.5 rounded-md hover:text-ink hover:bg-muted/60 transition-colors",
                  )}
                  activeProps={{ className: "text-ink bg-muted" }}
                  activeOptions={{ exact: "exact" in l && l.exact ? true : false }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
