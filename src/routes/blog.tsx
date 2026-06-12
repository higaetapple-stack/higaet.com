import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { ArrowRight } from "lucide-react";

type Post = { slug: string; title: string; excerpt: string; date: string; tag: string };

const POSTS: Post[] = [
  {
    slug: "the-state-of-ai-engineering-education",
    title: "The state of AI engineering education in 2026",
    excerpt:
      "Why traditional CS programs struggle to keep pace with applied AI — and what we built at HIGAET to close the gap.",
    date: "2026-05-21",
    tag: "Academy",
  },
  {
    slug: "study-abroad-checklist-fall-2026",
    title: "Study-abroad checklist: applying for Fall 2026 intakes",
    excerpt: "A clear, month-by-month plan for students targeting UK, US, and Canadian universities this cycle.",
    date: "2026-04-12",
    tag: "Global Hub",
  },
  {
    slug: "rag-vs-fine-tuning-2026",
    title: "RAG vs. fine-tuning: a practitioner's framework",
    excerpt: "Choosing between retrieval and fine-tuning based on the actual constraints of your enterprise system.",
    date: "2026-03-04",
    tag: "Technologies",
  },
];

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — HIGAET" },
      { name: "description", content: "Insights on AI engineering, study abroad, and enterprise AI from the HIGAET team." },
      { property: "og:title", content: "Blog — HIGAET" },
      { property: "og:description", content: "Insights on AI engineering, study abroad, and enterprise AI from the HIGAET team." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="HIGAET Journal"
        title="Field notes from the AI institute."
        subtitle="Curriculum design, university admissions, enterprise AI delivery — written by the people doing the work."
      />
      <Section className="!pt-0">
        <ul className="grid gap-px bg-border ring-1 ring-border rounded-2xl overflow-hidden">
          {POSTS.map((p) => (
            <li key={p.slug} className="bg-card">
              <Link
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group block p-8 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="font-semibold uppercase tracking-widest text-ink/60">{p.tag}</span>
                  <span>·</span>
                  <time dateTime={p.date}>{new Date(p.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time>
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-medium text-ink mb-3 text-balance">
                  {p.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-[68ch]">{p.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:translate-x-1 transition-transform">
                  Read more <ArrowRight className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </SiteShell>
  );
}
