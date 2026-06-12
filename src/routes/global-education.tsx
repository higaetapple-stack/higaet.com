import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/global-education", label: "Overview", exact: true },
  { to: "/global-education/study-abroad", label: "Study Abroad" },
  { to: "/global-education/universities", label: "Universities" },
  { to: "/global-education/scholarships", label: "Scholarships" },
  { to: "/global-education/countries", label: "Countries" },
  { to: "/global-education/visa-guidance", label: "Visa" },
  { to: "/global-education/student-services", label: "Student Services" },
  { to: "/global-education/admission-process", label: "Process" },
  { to: "/global-education/faq", label: "FAQ" },
  { to: "/global-education/contact", label: "Contact" },
] as const;

export const Route = createFileRoute("/global-education")({
  component: GlobalLayout,
});

function GlobalLayout() {
  return (
    <SiteShell>
      <div data-brand="global">
        <div className="border-b border-border bg-surface">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between gap-4 py-3 overflow-x-auto">
              <Link to="/global-education" className="font-display text-sm font-medium text-ink shrink-0 pr-4 border-r border-border">
                <span className="text-global">●</span> Global Education Hub
              </Link>
              <ul className="flex items-center gap-1 text-sm font-medium text-muted-foreground whitespace-nowrap">
                {NAV.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className={cn("px-3 py-1.5 rounded-md hover:text-ink hover:bg-muted/60 transition-colors")}
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
        <Outlet />
      </div>
    </SiteShell>
  );
}
