import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: AdminHome,
});

function AdminHome() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Admin</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Program management, user management, and role assignment.
      </p>
      <div className="mt-10 rounded-2xl bg-card ring-1 ring-border p-10 text-center">
        <div className="mx-auto size-12 rounded-full bg-academy/10 text-academy grid place-items-center">
          <ShieldCheck className="size-5" />
        </div>
        <h2 className="font-display text-lg font-medium text-ink mt-5">Coming in Sprint 2D</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Programs CRUD, course/lesson authoring, user role grants, and platform settings.
        </p>
      </div>
    </div>
  );
}
