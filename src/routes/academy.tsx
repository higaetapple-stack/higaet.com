import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { AcademyMegaMenu } from "@/components/site/AcademyMegaMenu";
import { AcademySearchTrigger } from "@/components/site/AcademySearch";

export const Route = createFileRoute("/academy")({
  component: AcademyLayout,
});

function AcademyLayout() {
  return (
    <SiteShell>
      <div data-brand="academy">
        <AcademySubHeader />
        <Outlet />
      </div>
    </SiteShell>
  );
}

function AcademySubHeader() {
  return (
    <div
      className="sticky top-16 z-40 border-b border-border bg-surface/90 backdrop-blur-md"
      aria-label="Academy navigation"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-6 min-w-0 overflow-x-auto">
            <Link
              to="/academy"
              className="font-display text-sm font-medium text-ink shrink-0 inline-flex items-center gap-1.5"
              aria-label="HIGAET Academy — home"
            >
              <span className="size-1.5 rounded-full bg-academy" aria-hidden />
              HIGAET Academy
            </Link>
            <nav aria-label="Academy primary">
              <AcademyMegaMenu />
            </nav>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AcademySearchTrigger />
            <Link
              to="/academy/admissions"
              className="inline-flex items-center gap-1.5 bg-academy text-white text-xs font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
            >
              Apply now <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
