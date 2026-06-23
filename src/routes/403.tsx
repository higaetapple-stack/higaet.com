import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ShieldAlert, ArrowLeft, Mail } from "lucide-react";
import { getMyRoles, type AppRole } from "@/lib/auth.functions";
import { useAuth } from "@/hooks/useAuth";

const Search = z.object({
  from: z.string().optional(),
  required: z.string().optional(),
});

export const Route = createFileRoute("/403")({
  validateSearch: (s) => Search.parse(s),
  head: () => ({
    meta: [
      { title: "403 — Access Denied | HIGAET" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForbiddenPage,
});

function ForbiddenPage() {
  const { from, required } = Route.useSearch();
  const { isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const fetchRoles = useServerFn(getMyRoles);
  const [roles, setRoles] = useState<AppRole[] | null>(null);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate({ to: "/auth/login", search: { redirect: from ?? "/dashboard" } as any });
    }
  }, [isReady, isAuthenticated, from, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRoles().then(setRoles).catch(() => setRoles([]));
  }, [isAuthenticated, fetchRoles]);

  const requiredList = (required ?? "").split(",").filter(Boolean);

  return (
    <main className="min-h-[70vh] grid place-items-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto size-14 rounded-full bg-destructive/10 text-destructive grid place-items-center">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="font-display text-3xl font-medium text-ink mt-6">Access denied</h1>
        <p className="text-muted-foreground mt-3">
          Your account doesn't have permission to view this page.
        </p>

        <dl className="mt-8 text-left text-sm rounded-2xl ring-1 ring-border bg-card p-5 space-y-3">
          {from && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Requested</dt>
              <dd className="font-mono text-ink truncate">{from}</dd>
            </div>
          )}
          {requiredList.length > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Required role</dt>
              <dd className="font-mono text-ink">{requiredList.join(" or ")}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Your roles</dt>
            <dd className="font-mono text-ink">
              {roles === null ? "…" : roles.length === 0 ? "none" : roles.join(", ")}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-medium ring-1 ring-ink/10 hover:bg-ink/90 transition"
          >
            <ArrowLeft className="size-4" /> Return to dashboard
          </Link>
          <a
            href="mailto:support@higaet.com?subject=Access%20request"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-ink ring-1 ring-border hover:bg-muted/50 transition"
          >
            <Mail className="size-4" /> Contact administrator
          </a>
        </div>
      </div>
    </main>
  );
}
