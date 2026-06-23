import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { requireRolesOrRedirect, ROUTE_PERMISSIONS } from "@/lib/route-authorization";

export const Route = createFileRoute("/_authenticated/dashboard/faculty")({
  beforeLoad: ({ location }) => requireRolesOrRedirect(ROUTE_PERMISSIONS["/dashboard/faculty"], { location }),
  component: FacultyHome,
});

function FacultyHome() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Faculty workspace</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Your assigned courses, students, and grading queue will appear here.
      </p>
      <div className="mt-10 rounded-2xl bg-card ring-1 ring-border p-10 text-center">
        <div className="mx-auto size-12 rounded-full bg-academy/10 text-academy grid place-items-center">
          <BookOpen className="size-5" />
        </div>
        <h2 className="font-display text-lg font-medium text-ink mt-5">Coming in Sprint 2B</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Course assignment, student rosters, assignment grading, and certificate issuance.
        </p>
      </div>
    </div>
  );
}
