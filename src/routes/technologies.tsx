import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/technologies", label: "Overview", exact: true },
  { to: "/technologies/custom-software-development", label: "Custom Software" },
  { to: "/technologies/ai-solutions", label: "AI Solutions" },
  { to: "/technologies/saas-products", label: "SaaS Products" },
  { to: "/technologies/cloud-solutions", label: "Cloud" },
  { to: "/technologies/software-development", label: "Software" },
  { to: "/technologies/digital-marketing", label: "Marketing" },
  { to: "/technologies/product-development", label: "Product" },
  { to: "/technologies/case-studies", label: "Case Studies" },
  { to: "/technologies/industries", label: "Industries" },
  { to: "/technologies/careers", label: "Careers" },
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
