import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock, Share2, Tag } from "lucide-react";
import { ServiceHero } from "./ServiceHero";
import { StickyTabNav } from "./StickyTabNav";
import { Section, Eyebrow } from "./Section";
import { breadcrumbJsonLd, type Crumb } from "./Breadcrumbs";
import { jsonLdScript } from "./JsonLd";
import { CTASection } from "./CTASection";
import { FAQ } from "./FAQ";
import {
  type InsightContent,
  CATEGORY_LABELS,
  relatedInsights,
} from "@/content/insights";
import { ALL_SERVICES } from "@/content/services.index";
import { ALL_TECHNOLOGIES } from "@/content/technologies.index";
import { ALL_INDUSTRIES } from "@/content/industries.index";
import { CASE_STUDIES } from "@/content/case-studies";

export function buildInsightHead(i: InsightContent) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Insights", href: "/technologies/insights" },
    { label: CATEGORY_LABELS[i.category], href: `/technologies/insights?category=${i.category}` },
    { label: i.title, href: i.path },
  ];
  return {
    meta: [
      { title: i.metaTitle },
      { name: "description", content: i.metaDescription },
      { name: "author", content: i.author.name },
      { property: "og:title", content: i.metaTitle },
      { property: "og:description", content: i.metaDescription },
      { property: "og:url", content: i.path },
      { property: "og:type", content: "article" },
      { property: "article:published_time", content: i.publishedAt },
      ...(i.updatedAt ? [{ property: "article:modified_time", content: i.updatedAt }] : []),
      { property: "article:section", content: CATEGORY_LABELS[i.category] },
      ...i.tags.map((t) => ({ property: "article:tag" as const, content: t })),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: i.metaTitle },
      { name: "twitter:description", content: i.metaDescription },
    ],
    links: [{ rel: "canonical", href: i.path }],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: i.title,
        description: i.metaDescription,
        datePublished: i.publishedAt,
        dateModified: i.updatedAt ?? i.publishedAt,
        articleSection: CATEGORY_LABELS[i.category],
        keywords: i.tags,
        wordCount: i.sections.reduce((n, s) => n + s.body.join(" ").split(/\s+/).length, 0),
        author: { "@type": "Organization", name: i.author.name, description: i.author.bio },
        publisher: {
          "@type": "Organization",
          name: "HIGAET Technologies",
          url: "/technologies",
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": i.path },
      }),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: i.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }),
      jsonLdScript(breadcrumbJsonLd(breadcrumbs)),
    ],
  };
}

export function InsightDetailPage({ content: i }: { content: InsightContent }) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Insights", href: "/technologies/insights" },
    { label: i.title, href: i.path },
  ];

  const tocItems = [
    { id: "summary", label: "Summary" },
    ...i.sections.map((s) => ({ id: s.id, label: s.heading })),
    { id: "related", label: "Related" },
    { id: "faq", label: "FAQ" },
  ];

  const relServices = i.relatedServiceSlugs.map((s) => ALL_SERVICES[s]).filter(Boolean);
  const relTech = i.relatedTechnologySlugs.map((s) => ALL_TECHNOLOGIES[s]).filter(Boolean);
  const relIndustries = i.relatedIndustrySlugs.map((s) => ALL_INDUSTRIES[s]).filter(Boolean);
  const relCases = i.relatedCaseStudySlugs.map((s) => CASE_STUDIES_BY_SLUG[s]).filter(Boolean);
  const relPosts = relatedInsights(i.slug, 3);

  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow={`Insights · ${CATEGORY_LABELS[i.category]}`}
        title={i.title}
        subtitle={i.excerpt}
        breadcrumbs={breadcrumbs}
        primaryHref="/technologies/contact"
        primaryLabel="Talk to our team"
        secondaryHref="/technologies/insights"
        secondaryLabel="All insights"
        highlights={i.tags.slice(0, 3).map((t) => `Topic: ${t}`)}
      >
        <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-xl">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="size-3" aria-hidden /> Published
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {new Date(i.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3" aria-hidden /> Reading
            </dt>
            <dd className="mt-1 text-sm text-ink">{i.readingMinutes} min</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Author</dt>
            <dd className="mt-1 text-sm text-ink">{i.author.name}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="size-3" aria-hidden /> Category
            </dt>
            <dd className="mt-1 text-sm text-ink">{CATEGORY_LABELS[i.category]}</dd>
          </div>
        </dl>
      </ServiceHero>

      <StickyTabNav items={tocItems} />

      <Section id="summary">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.3fr] lg:items-end">
          <div>
            <Eyebrow brand="tech">Executive summary</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              The short version, for leaders.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty max-w-[62ch]">
            {i.executiveSummary}
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2">
          {i.tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-ink">
              #{t}
            </span>
          ))}
        </div>
      </Section>

      {i.sections.map((s, idx) => (
        <Section key={s.id} id={s.id} className={idx % 2 === 0 ? "bg-muted/40" : ""}>
          <Eyebrow brand="tech">{`0${idx + 1}`.slice(-2)}</Eyebrow>
          <h2 className="mt-4 mb-6 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[42ch]">
            {s.heading}
          </h2>
          <div className="space-y-5 max-w-[68ch]">
            {s.body.map((p, pi) => (
              <p key={pi} className="text-base md:text-lg leading-relaxed text-muted-foreground text-pretty">
                {p}
              </p>
            ))}
          </div>
          {s.bullets && (
            <ul className="mt-8 grid gap-3 md:grid-cols-2 max-w-3xl">
              {s.bullets.map((b) => (
                <li key={b} className="rounded-2xl bg-card p-4 ring-1 ring-border text-sm leading-relaxed text-ink">
                  {b}
                </li>
              ))}
            </ul>
          )}
          {s.callout && (
            <aside className="mt-8 rounded-2xl bg-ink p-6 md:p-8 text-surface max-w-3xl">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-surface/60">
                {s.callout.label}
              </span>
              <p className="mt-3 font-display text-lg md:text-xl leading-snug text-balance">
                {s.callout.body}
              </p>
            </aside>
          )}
        </Section>
      ))}

      <Section id="related">
        <Eyebrow brand="tech">Related</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[44ch]">
          Connected services, technologies, industries and case studies.
        </h2>

        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-tech">Services</h3>
            <ul className="mt-4 space-y-2">
              {relServices.map((s) => (
                <li key={s.slug}>
                  <Link to={s.path} className="text-sm text-ink hover:text-tech transition-colors">
                    {s.eyebrow} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-tech">Technologies</h3>
            <ul className="mt-4 grid grid-cols-1 gap-y-2">
              {relTech.map((t) => (
                <li key={t.slug}>
                  <Link to={t.path} className="text-sm text-ink hover:text-tech transition-colors">
                    {t.eyebrow} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-tech">Industries</h3>
            <ul className="mt-4 space-y-2">
              {relIndustries.map((ind) => (
                <li key={ind.slug}>
                  <Link to={ind.path} className="text-sm text-ink hover:text-tech transition-colors">
                    {ind.eyebrow} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-tech">Case studies</h3>
            <ul className="mt-4 space-y-2">
              {relCases.map((c) => (
                <li key={c.slug}>
                  <Link to={c.path} className="text-sm text-ink hover:text-tech transition-colors">
                    {c.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {relPosts.length > 0 && (
          <div className="mt-14">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-tech">More insights</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {relPosts.map((r) => (
                <Link
                  key={r.slug}
                  to={r.path}
                  className="group block rounded-2xl bg-card p-6 ring-1 ring-border hover:ring-foreground/30 transition"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-tech">
                    {CATEGORY_LABELS[r.category]}
                  </span>
                  <h4 className="mt-3 font-display text-lg font-medium text-ink leading-snug text-balance">
                    {r.title}
                  </h4>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-ink group-hover:translate-x-1 transition-transform">
                    Read <ArrowRight className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5">
            <Share2 className="size-3" aria-hidden /> Share
          </span>
          <ShareLinks path={i.path} title={i.title} />
        </div>
      </Section>

      <Section id="faq" className="bg-muted/40">
        <Eyebrow brand="tech">Frequently asked</Eyebrow>
        <h2 className="mt-4 mb-8 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
          Questions readers ask us next.
        </h2>
        <FAQ items={i.faqs} />
      </Section>

      <CTASection
        eyebrow="HIGAET Technologies"
        title={i.cta.title}
        body={i.cta.body}
        primaryHref="/technologies/contact"
        primaryLabel="Start a conversation"
        secondaryHref="/technologies/insights"
        secondaryLabel="Browse more insights"
      />
    </>
  );
}

function ShareLinks({ path, title }: { path: string; title: string }) {
  // Path-only share links remain valid once a custom domain is connected,
  // because share targets resolve relative paths against the current host.
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(path);
  const links = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "X / Twitter", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { label: "Email", href: `mailto:?subject=${t}&body=${u}` },
  ];
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-card px-3 py-1 text-xs font-medium text-ink ring-1 ring-border hover:ring-foreground/30 transition"
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
