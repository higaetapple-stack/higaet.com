import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { MfaCard } from "@/components/security/MfaCard";
import { SessionsCard } from "@/components/security/SessionsCard";
import { SecurityActivity } from "@/components/security/SecurityActivity";

export const Route = createFileRoute("/_authenticated/dashboard/security")({
  head: () => ({ meta: [{ title: "Security — HIGAET" }, { name: "robots", content: "noindex" }] }),
  component: SecurityPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function SecurityPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink">Security</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage two-factor authentication, sessions, and review activity on your account.
        </p>
      </header>
      <MfaCard />
      <SessionsCard />
      <Suspense fallback={<Loader2 className="size-4 animate-spin text-muted-foreground" />}>
        <SecurityActivity />
      </Suspense>
    </div>
  );
}
