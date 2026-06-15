import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { ArrowLeft } from "lucide-react";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  body: string[];
};

const POSTS: Record<string, Post> = {
  "the-state-of-ai-engineering-education": {
    slug: "the-state-of-ai-engineering-education",
    title: "The state of AI engineering education in 2026",
    excerpt: "Why traditional CS programs struggle to keep pace with applied AI — and what we built at HIGAET to close the gap.",
    date: "2026-05-21",
    tag: "Academy",
    body: [
      "Three years into the post-ChatGPT shift, most computer-science programs still treat applied AI as an elective rather than a discipline. Employers do not.",
      "At HIGAET, we redesigned the curriculum around the things AI engineers actually do at work: evaluating models, building retrieval pipelines, shipping safe agents, and operating those systems in production.",
      "The piece below outlines our framework — how learning outcomes are derived from real role profiles, why every cohort builds an enterprise capstone, and what we measure to know it is working.",
    ],
  },
  "study-abroad-checklist-fall-2026": {
    slug: "study-abroad-checklist-fall-2026",
    title: "Study-abroad checklist: applying for Fall 2026 intakes",
    excerpt: "A clear, month-by-month plan for students targeting UK, US, and Canadian universities this cycle.",
    date: "2026-04-12",
    tag: "Global Hub",
    body: [
      "The Fall 2026 intake cycle has already opened at most universities. If you intend to apply for a graduate program in the UK, US, or Canada, the next six months matter more than the next sixty.",
      "This guide walks through the timeline we use with HIGAET Global Hub students — when to take standardized tests, when to finalize your university shortlist, when to file your scholarship applications, and when to begin your visa file.",
    ],
  },
  "rag-vs-fine-tuning-2026": {
    slug: "rag-vs-fine-tuning-2026",
    title: "RAG vs. fine-tuning: a practitioner's framework",
    excerpt: "Choosing between retrieval and fine-tuning based on the actual constraints of your enterprise system.",
    date: "2026-03-04",
    tag: "Technologies",
    body: [
      "Most teams default to one of two strategies — retrieval-augmented generation or fine-tuning — without rigorously thinking about which their use case actually calls for.",
      "We use a four-factor framework with our enterprise clients: data freshness, output specificity, evaluation strategy, and operating cost. This post walks through each.",
    ],
  },
};

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = POSTS[params.slug];
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "Post not found — HIGAET" }] };
    return {
      meta: [
        { title: `${post.title} — HIGAET` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/blog/${post.slug}` },
        { property: "article:published_time", content: post.date },
        { property: "article:section", content: post.tag },
      ],
      links: [{ rel: "canonical", href: `/blog/${post.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: { "@type": "Organization", name: "HIGAET" },
            articleSection: post.tag,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <Section>
        <h1 className="font-display text-3xl font-medium text-ink mb-4">Post not found</h1>
        <Link to="/blog" className="text-sm text-ink underline">
          Back to the journal
        </Link>
      </Section>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <Section>
        <h1 className="font-display text-3xl font-medium text-ink mb-4">Something went wrong</h1>
        <Link to="/blog" className="text-sm text-ink underline">Back to the journal</Link>
      </Section>
    </SiteShell>
  ),
  component: PostPage,
});

function PostPage() {
  const { post } = Route.useLoaderData();
  return (
    <SiteShell>
      <article>
        <Section className="!py-16">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink mb-8">
            <ArrowLeft className="size-4" /> All posts
          </Link>
          <header className="max-w-3xl">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="font-semibold uppercase tracking-widest text-ink/60">{post.tag}</span>
              <span>·</span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] text-balance mb-6 text-ink">
              {post.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
          </header>

          <div className="prose-content mt-12 max-w-3xl space-y-6 text-foreground/90 leading-relaxed">
            {post.body.map((p: string, i: number) => (
              <p key={i} className="text-base md:text-lg text-muted-foreground">
                {p}
              </p>
            ))}
          </div>
        </Section>
      </article>
    </SiteShell>
  );
}
