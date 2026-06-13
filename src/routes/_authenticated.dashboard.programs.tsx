import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/programs")({
  component: MyPrograms,
});

function MyPrograms() {
  // Sprint 2A: empty state. Sprint 2B will wire real enrolments.
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">My programs</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Programs you've enrolled in will appear here, with progress and upcoming sessions.
      </p>

      <div className="mt-10 rounded-2xl bg-card ring-1 ring-border p-10 text-center">
        <div className="mx-auto size-12 rounded-full bg-academy/10 text-academy grid place-items-center">
          <GraduationCap className="size-5" />
        </div>
        <h2 className="font-display text-lg font-medium text-ink mt-5">No active enrolments yet</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Browse HIGAET's career tracks and apply to a cohort to start learning.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/academy/programs"
            className="inline-flex items-center gap-2 bg-academy text-white text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
          >
            Browse programs <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/academy/admissions"
            className="inline-flex items-center gap-2 ring-1 ring-border text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors"
          >
            Apply now
          </Link>
        </div>
      </div>
    </div>
  );
}
