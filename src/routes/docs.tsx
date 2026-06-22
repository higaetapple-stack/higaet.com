import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "HIGAET Developer Docs" },
      { name: "description", content: "HIGAET platform docs — Public API v1, authentication, webhooks, and integration guides." },
      { property: "og:title", content: "HIGAET Developer Docs" },
      { property: "og:description", content: "Public API v1, authentication, webhooks, and integration guides." },
    ],
  }),
  component: DocsLayout,
});

const NAV = [
  { to: "/docs", label: "Getting started", exact: true },
  { to: "/docs/authentication", label: "Authentication" },
  { to: "/docs/api-reference", label: "API reference" },
  { to: "/docs/webhooks", label: "Webhooks" },
];

function DocsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-[220px_1fr] gap-10">
      <aside className="md:sticky md:top-20 self-start">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Docs</div>
        <nav className="flex md:flex-col gap-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md",
                  active ? "bg-academy/10 text-academy font-medium" : "text-muted-foreground hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="prose prose-slate max-w-none">
        <Outlet />
      </main>
    </div>
  );
}
