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
      "Three years into the post-ChatGPT shift, most computer-science programs still treat applied AI as an elective rather than a discipline. Employers do not. Job postings for AI engineers, ML platform engineers, and applied research engineers have grown faster than any other technical role since 2023, and the gap between what graduates can do on day one and what teams need them to do by week two has become the single largest hiring bottleneck in the industry.",
      "## The shape of the gap",
      "Traditional CS curricula optimize for foundations: algorithms, operating systems, compilers, a semester of machine-learning theory built around scikit-learn and a final project on MNIST. That foundation still matters. It is no longer sufficient. An AI engineer in 2026 spends more time writing evaluation harnesses than training models, more time stitching tools and retrieval into an agent loop than tuning hyperparameters, and more time defending a system against prompt injection, hallucination, and cost blow-ups than optimizing F1 by two points on a held-out set.",
      "Universities know this. The problem is structural. Curriculum committees move on multi-year cycles; frontier capabilities move on multi-week cycles. A syllabus that locks in a specific model family, framework, or evaluation harness in September is already partially obsolete by the time the cohort sits its January exams.",
      "## What the work actually looks like",
      "When we audited the day-to-day work of 200+ AI engineers across enterprise, scale-up, and frontier-lab teams, five activities accounted for the vast majority of billable hours: writing and maintaining evaluation suites, designing retrieval and context-assembly pipelines, building and instrumenting agent and tool-use loops, hardening systems against adversarial and edge-case inputs, and operating those systems under real cost, latency, and compliance constraints.",
      "Almost none of this appears in a standard ML syllabus. Most of it is invisible in research papers. All of it is what separates a deployable engineer from a confident prototyper.",
      "## How HIGAET teaches it",
      "We redesigned the HIGAET Academy curriculum around those five activities, then worked backward into the foundations each one demands. Every module starts from a role profile — what does an AI engineer on a regulated-industry team need to be able to do by their first sprint? — and the learning outcomes are derived from there.",
      "Three structural commitments make this work in practice. First, every cohort ships an enterprise capstone built against a real brief from a HIGAET Technologies client or partner. Second, evaluation is continuous and behavioral: learners are graded on the eval suites they write and the failure modes they catch, not just on the models they fine-tune. Third, the curriculum is versioned monthly. When a new model class, retrieval pattern, or safety technique materially changes the work, the relevant module is rewritten — not deferred to next year's intake.",
      "## What we measure",
      "We track three outcomes that map to employer expectations rather than academic convention: time-to-first-shipped-feature in a learner's first role, the percentage of graduates whose first production system survives a third-party safety and cost review without rework, and the rate at which hiring partners return for a second cohort. Those three numbers, watched over time, tell us whether the program is closing the gap or simply restating it.",
      "## The bigger picture",
      "AI engineering education is not a faster version of CS education. It is a different discipline with its own craft, its own failure modes, and its own definition of mastery. Universities that recognize this — and that build the operational muscle to teach against a moving frontier — will produce the engineers the next decade of the industry depends on. The rest will keep graduating students who are well prepared for a world that no longer exists.",
      "That is the gap HIGAET was built to close, and the work we will keep publishing about here.",
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
      links: [` }],
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
            {post.body.map((p: string, i: number) =>
              p.startsWith("## ") ? (
                <h2 key={i} className="font-display text-2xl md:text-3xl font-medium text-ink mt-12 mb-2 tracking-tight">
                  {p.slice(3)}
                </h2>
              ) : (
                <p key={i} className="text-base md:text-lg text-muted-foreground">
                  {p}
                </p>
              )
            )}
          </div>
        </Section>
      </article>
    </SiteShell>
  );
}
