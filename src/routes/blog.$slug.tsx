import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";

const POSTS: Record<string, {
  title: string;
  excerpt: string;
  content: string;
  date: string;
  tag: string;
  readTime: string;
}> = {
  "the-state-of-ai-engineering-education": {
    title: "The state of AI engineering education in 2026",
    excerpt: "Why traditional CS programs struggle to keep pace with applied AI — and what we built at HIGAET to close the gap.",
    date: "2026-05-21",
    tag: "Academy",
    readTime: "8 min read",
    content: `
      <p>The gap between what universities teach and what AI engineering teams actually need has never been wider.</p>
      <h2>The curriculum lag</h2>
      <p>Most computer science programs still treat machine learning as an elective. They teach theory — backpropagation, gradient descent, loss functions — but not the engineering reality of shipping LLM systems: retrieval, evaluation, observability, cost control, and safety guardrails.</p>
      <h2>What HIGAET Academy does differently</h2>
      <p>We built our programs around what AI engineers actually do every day:</p>
      <ul>
        <li><strong>Foundations first:</strong> Linear algebra, probability, and Python patterns you will actually use</li>
        <li><strong>Applied depth:</strong> RAG architectures, agent orchestration, eval frameworks</li>
        <li><strong>Production reality:</strong> Cost-aware inference, latency budgets, guardrails, red-teaming</li>
        <li><strong>Capstone with industry:</strong> Live briefs from hiring partners, architecture reviews, production deployment</li>
      </ul>
      <h2>The result</h2>
      <p>Graduates don't just know ML theory — they've shipped working AI systems, run evaluations, and defended architecture decisions to hiring partners.</p>
    `,
  },
  "study-abroad-checklist-fall-2026": {
    title: "Study-abroad checklist: applying for Fall 2026 intakes",
    excerpt: "A clear, month-by-month plan for students targeting UK, US, and Canadian universities this cycle.",
    date: "2026-04-12",
    tag: "Global Hub",
    readTime: "6 min read",
    content: `
      <p>Fall 2026 applications open soon. Here is your timeline.</p>
      <h2>12–18 months before intake</h2>
      <ul>
        <li>Research destinations and programs</li>
        <li>Take standardized tests (IELTS/TOEFL, GRE/GMAT if required)</li>
        <li>Build your university shortlist: safe, match, reach</li>
      </ul>
      <h2>9–12 months before</h2>
      <ul>
        <li>Request transcripts and recommendation letters</li>
        <li>Draft SOPs and personal statements</li>
        <li>Apply for scholarships and funding</li>
      </ul>
      <h2>6–9 months before</h2>
      <ul>
        <li>Submit applications before deadlines</li>
        <li>Prepare financial evidence for visa</li>
        <li>Track application status across portals</li>
      </ul>
      <h2>3–6 months before</h2>
      <ul>
        <li>Accept offer and pay deposit</li>
        <li>Apply for student visa</li>
        <li>Arrange housing, insurance, travel</li>
      </ul>
    `,
  },
  "rag-vs-fine-tuning-2026": {
    title: "RAG vs. fine-tuning: a practitioner's framework",
    excerpt: "Choosing between retrieval and fine-tuning based on the actual constraints of your enterprise system.",
    date: "2026-03-04",
    tag: "Technologies",
    readTime: "10 min read",
    content: `
      <p>The debate between RAG and fine-tuning misses the point: they solve different problems.</p>
      <h2>When to use RAG</h2>
      <ul>
        <li>Knowledge changes frequently</li>
        <li>You need citations and auditability</li>
        <li>Domain knowledge is large but well-documented</li>
        <li>Compliance requires traceable answers</li>
      </ul>
      <h2>When to fine-tune</h2>
      <ul>
        <li>Model behavior needs to change (style, format, reasoning)</li>
        <li>Low-latency, high-throughput inference required</li>
        <li>Proprietary reasoning patterns not in base model</li>
        <li>You have high-quality training data (1k+ examples)</li>
      </ul>
      <h2>The pragmatic approach</h2>
      <p>Most production systems need both: RAG for knowledge, fine-tuning for behavior. Start with RAG, measure, then fine-tune only where retrieval alone fails.</p>
    `,
  },
};

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    const post = POSTS[slug];
    if (!post) {
      return {
        meta: [{ title: "Post not found — HIGAET" }],
      };
    }
    const url = "https://www.higaet.com/blog/" + slug;
    return {
      meta: [
        { title: post.title + " — HIGAET Journal" },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: post.date },
        { property: "article:tag", content: post.tag },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: { "@type": "Organization", name: "HIGAET" },
            publisher: { "@type": "Organization", name: "HIGAET" },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.higaet.com/" },
              { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.higaet.com/blog" },
              { "@type": "ListItem", "position": 3, "name": post.title, "item": url },
            ],
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = POSTS[slug];

  if (!post) {
    return (
      <SiteShell>
        <PageHero eyebrow="Blog" title="Post not found" subtitle="The article you are looking for does not exist." />
        <Section className="!pt-0">
          <p className="text-muted-foreground">The article you are looking for does not exist.</p>
          <Link to="/blog" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-tech">
            Back to Blog
          </Link>
        </Section>
      </SiteShell>
    );
  }

  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Blog", url: "/blog" },
    { label: post.title, url: undefined },
  ];

  return (
    <SiteShell>
      <div className="px-6 pt-8">
        <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden>/</span>}
                {c.url ? (
                  <Link to={c.url} className="hover:text-ink transition-colors">{c.label}</Link>
                ) : (
                  <span className="text-ink font-medium">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <PageHero
        eyebrow={post.tag}
        title={post.title}
        subtitle={post.excerpt}
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
          <span>·</span>
          <span>{post.readTime}</span>
          <span>{post.tag}</span>
        </div>
      </PageHero>

      <Section className="!pt-0">
        <div className="max-w-3xl">
          <article className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </article>
        </div>
      </Section>

      <CTASection
        title="Want more insights like this?"
        body="Subscribe to the HIGAET Journal for field notes on AI engineering, study abroad, and enterprise AI."
        primaryHref="/blog"
        primaryLabel="Read more articles"
      />
    </SiteShell>
  );
}
