import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-10 text-center">
      <div className="mx-auto size-12 rounded-full bg-academy/10 text-academy grid place-items-center">
        <Settings className="size-5" />
      </div>
      <h2 className="font-display text-lg font-medium text-ink mt-5">Platform settings</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        Branding, email senders, default enrollment policies, certificate signing — coming as the platform matures.
      </p>
    </div>
  );
}
