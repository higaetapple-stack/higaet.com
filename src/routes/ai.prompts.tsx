import { createFileRoute, Link } from "@tanstack/react-router";
import { AI_STARTER_PROMPTS } from "@/content/ai-prompts";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/ai/prompts")({
  component: PromptsLibrary,
});

function PromptsLibrary() {
  const byCategory = new Map<string, typeof AI_STARTER_PROMPTS>();
  for (const p of AI_STARTER_PROMPTS) {
    const arr = byCategory.get(p.category) ?? [];
    arr.push(p);
    byCategory.set(p.category, arr);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl text-ink">Prompt library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Curated starter prompts for career, learning, study abroad, and interview prep. One click
          to launch into a guided chat with the HIGAET Assistant.
        </p>
      </header>

      {Array.from(byCategory.entries()).map(([cat, prompts]) => (
        <section key={cat}>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{cat}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {prompts.map((p) => (
              <article
                key={p.id}
                className="p-4 rounded-lg border border-border bg-surface flex flex-col"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-ink text-sm">{p.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </div>
                <pre className="mt-3 text-[11px] text-muted-foreground bg-muted/30 rounded-md p-2 whitespace-pre-wrap line-clamp-3">
                  {p.prompt}
                </pre>
                <Link
                  to="/ai/chat"
                  search={{ prompt: p.id }}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
                >
                  Launch in chat <ArrowRight className="size-3" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
