import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="px-6 py-5 border-b border-border/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-display font-semibold text-xl tracking-tight text-ink">
            HIGAET
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-ink">
            Back to site
          </Link>
        </div>
      </header>
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-8">
      <h1 className="font-display text-2xl font-medium text-ink mb-2">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
      {children}
      {footer && <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
