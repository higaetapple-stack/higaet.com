import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/counselor")({
  component: CounselorHome,
});

function CounselorHome() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Counselling workspace</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Lead pipeline, admissions calls, and applications will appear here.
      </p>
      <div className="mt-10 rounded-2xl bg-card ring-1 ring-border p-10 text-center">
        <div className="mx-auto size-12 rounded-full bg-academy/10 text-academy grid place-items-center">
          <ClipboardList className="size-5" />
        </div>
        <h2 className="font-display text-lg font-medium text-ink mt-5">Coming in Sprint 2D</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Lead inbox, counsellor assignment, follow-ups, and enrolment confirmation.
        </p>
      </div>
    </div>
  );
}
