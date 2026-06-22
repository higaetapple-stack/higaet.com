import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Sparkles, MessageSquare, History, Library, Wand2 } from "lucide-react";

export const Route = createFileRoute("/ai")({
  component: AiHubLayout,
  head: () => ({
    meta: [
      { title: "HIGAET AI — Learn, plan, and grow with AI" },
      {
        name: "description",
        content:
          "HIGAET AI Hub: chat with the HIGAET Assistant, explore curated knowledge collections, and launch starter prompts for career, study abroad, and learning.",
      },
      { property: "og:title", content: "HIGAET AI" },
      { property: "og:description", content: "Your AI companion for career, study abroad, and learning." },
    ],
  }),
});

interface AiTab {
  to: "/ai" | "/ai/chat" | "/ai/history" | "/ai/collections" | "/ai/prompts";
  label: string;
  icon: typeof Sparkles;
  exact?: boolean;
}

const TABS: AiTab[] = [
  { to: "/ai", label: "Overview", icon: Sparkles, exact: true },
  { to: "/ai/chat", label: "Chat", icon: MessageSquare },
  { to: "/ai/history", label: "History", icon: History },
  { to: "/ai/collections", label: "Knowledge", icon: Library },
  { to: "/ai/prompts", label: "Prompts", icon: Wand2 },
];

function AiHubLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/ai" className="flex items-center gap-2">
            <span className="size-7 rounded-md bg-gradient-to-br from-primary to-academy grid place-items-center text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-lg font-medium text-ink">HIGAET AI</span>
          </Link>
          <nav className="hidden md:flex gap-1">
            {TABS.map((t) => {
              const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors inline-flex items-center gap-1.5",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-ink hover:bg-muted/40",
                  )}
                >
                  <t.icon className="size-3.5" />
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
