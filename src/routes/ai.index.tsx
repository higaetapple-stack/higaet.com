import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Library, Wand2, History, ArrowRight } from "lucide-react";
import { AI_STARTER_PROMPTS } from "@/content/ai-prompts";

export const Route = createFileRoute("/ai/")({
  component: AiHubLanding,
});

function AiHubLanding() {
  const featured = AI_STARTER_PROMPTS.slice(0, 4);
  return (
    <div className="space-y-10">
      <section className="text-center max-w-3xl mx-auto pt-6">
        <h1 className="font-display text-4xl md:text-5xl font-medium text-ink leading-tight">
          One AI surface for everything HIGAET.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Chat with the HIGAET Assistant grounded in our Academy, Global Education, Technology, and
          Community knowledge. Get career roadmaps, learning paths, university shortlists, and
          visa guidance — instantly.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            to="/ai/chat"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <MessageSquare className="size-4" /> Start chatting
          </Link>
          <Link
            to="/ai/prompts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border hover:bg-muted/40 text-sm font-medium"
          >
            <Wand2 className="size-4" /> Browse prompts
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          { to: "/ai/collections", icon: Library, title: "Knowledge", desc: "Browse the curated collections powering retrieval." },
          { to: "/ai/history", icon: History, title: "Your conversations", desc: "Resume, search, or clean up past chats." },
          { to: "/ai/prompts", icon: Wand2, title: "Starter prompts", desc: "Career, learning, visa, and interview workflows." },
        ].map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group p-5 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors"
          >
            <c.icon className="size-5 text-primary" />
            <h3 className="mt-3 font-medium text-ink">{c.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
            <div className="mt-3 text-sm text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Open <ArrowRight className="size-3.5" />
            </div>
          </Link>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-ink">Featured prompts</h2>
          <Link to="/ai/prompts" className="text-sm text-primary hover:underline">All prompts →</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {featured.map((p) => (
            <Link
              key={p.id}
              to="/ai/chat"
              search={{ prompt: p.id }}
              className="p-4 rounded-lg border border-border bg-surface hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <div className="min-w-0">
                  <h3 className="font-medium text-ink text-sm">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
