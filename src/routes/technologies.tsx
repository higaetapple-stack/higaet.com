import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/technologies", label: "Overview", exact: true },
  { to: "/technologies/custom-software-development", label: "Custom" },
  { to: "/technologies/enterprise-software", label: "Enterprise" },
  { to: "/technologies/web-development", label: "Web" },
  { to: "/technologies/mobile-development", label: "Mobile" },
  { to: "/technologies/ai-solutions", label: "AI" },
  { to: "/technologies/data-engineering", label: "Data" },
  { to: "/technologies/business-intelligence", label: "BI" },
  { to: "/technologies/cloud-solutions", label: "Cloud" },
  { to: "/technologies/cloud-migration", label: "Migration" },
  { to: "/technologies/devops", label: "DevOps" },
  { to: "/technologies/qa-testing", label: "QA" },
  { to: "/technologies/saas-products", label: "SaaS" },
  { to: "/technologies/api-development", label: "APIs" },
  { to: "/technologies/system-integration", label: "Integration" },
  { to: "/technologies/legacy-modernization", label: "Legacy" },
  { to: "/technologies/software-maintenance", label: "Support" },
  { to: "/technologies/ui-ux-design", label: "Design" },
  { to: "/technologies/digital-transformation", label: "Transformation" },
  { to: "/technologies/dedicated-team", label: "Teams" },
  { to: "/technologies/staff-augmentation", label: "Staffing" },
  { to: "/technologies/it-consulting", label: "Consulting" },
  { to: "/technologies/industries", label: "Industries" },
  { to: "/technologies/expertise", label: "Expertise" },
  { to: "/technologies/case-studies", label: "Cases" },
  { to: "/technologies/contact", label: "Contact" },
] as const;

export const Route = createFileRoute("/technologies")({
  component: TechLayout,
});

function TechLayout() {
  return (
    <SiteShell>
      <div data-brand="tech">
        <div className="border-b border-border bg-surface">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between gap-4 py-3 overflow-x-auto">
              <Link to="/technologies" className="font-display text-sm font-medium text-ink shrink-0 pr-4 border-r border-border">
                <span className="text-tech">●</span> HIGAET Technologies
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
