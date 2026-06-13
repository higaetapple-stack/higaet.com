import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, CheckCircle2, Clock, Users } from "lucide-react";
import { ServiceHero } from "./ServiceHero";
import { StickyTabNav } from "./StickyTabNav";
import { Section, Eyebrow } from "./Section";
import { ProcessTimeline } from "./ProcessTimeline";
import { breadcrumbJsonLd, type Crumb } from "./Breadcrumbs";
import { jsonLdScript } from "./JsonLd";
import { CTASection } from "./CTASection";
import { LeadForm } from "./LeadForm";
import { CaseStudyCard, type CaseStudy } from "./CaseStudyCard";
import {
  type CaseStudyContent,
  relatedCaseStudies,
} from "@/content/case-studies";
import { ALL_SERVICES } from "@/content/services.index";
import { ALL_INDUSTRIES } from "@/content/industries.index";
import { ALL_TECHNOLOGIES } from "@/content/technologies.index";
import { ENGAGEMENT_MODELS } from "@/content/engagement";

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "challenge", label: "Challenge" },
  { id: "objectives", label: "Objectives" },
  { id: "solution", label: "Solution" },
  { id: "architecture", label: "Architecture" },
  { id: "stack", label: "Stack" },
  { id: "process", label: "Process" },
  { id: "results", label: "Results" },
  { id: "related", label: "Related" },
  { id: "contact", label: "Contact" },
];

export function buildCaseStudyHead(c: CaseStudyContent) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Case Studies", href: "/technologies/case-studies" },
    { label: c.title, href: c.path },
  ];
  return {
    meta: [
      { title: c.metaTitle },
      { name: "description", content: c.metaDescription },
      { property: "og:title", content: c.metaTitle },
      { property: "og:description", content: c.metaDescription },
      { property: "og:url", content: c.path },
      { property: "og:type", content: "article" },
      { property: "article:published_time", content: c.publishedAt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: c.metaTitle },
      { name: "twitter:description", content: c.metaDescription },
    ],
    links: [{ rel: "canonical", href: c.path }],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: c.title,
        description: c.metaDescription,
        datePublished: c.publishedAt,
        author: { "@type": "Organization", name: "HIGAET Technologies" },
        publisher: {
          "@type": "Organization",
          name: "HIGAET Technologies",
          url: "/technologies",
        },
        about: c.tags,
        articleSection: c.categoryLabel,
        url: c.path,
      }),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "CaseStudy",
        name: c.title,
        description: c.metaDescription,
        url: c.path,
        industry: c.industry,
        provider: { "@type": "Organization", name: "HIGAET Technologies" },
      }),
      jsonLdScript(breadcrumbJsonLd(breadcrumbs)),
    ],
  };
}

function lookupServices(slugs: string[]) {
  return slugs.map((s) => ALL_SERVICES[s]).filter(Boolean);
}
function lookupTech(slugs: string[]) {
  return slugs.map((s) => ALL_TECHNOLOGIES[s]).filter(Boolean);
}

export function CaseStudyDetailPage({ content: c }: { content: CaseStudyContent }) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Case Studies", href: "/technologies/case-studies" },
    { label: c.title, href: c.path },
  ];

  const relatedServices = lookupServices(c.serviceSlugs);
  const relatedTech = lookupTech(c.technologySlugs);
  const relatedIndustry = ALL_INDUSTRIES[c.industrySlug];
  const engagement = c.engagementSlug ? ENGAGEMENT_MODELS[c.engagementSlug] : null;
  const related = relatedCaseStudies(c.slug, 3);

  const relatedCards: CaseStudy[] = related.map((r) => ({
    slug: r.slug,
    industry: r.industry,
    title: r.title,
    summary: r.summary,
    metrics: r.metrics,
    stack: r.tags.slice(0, 4),
    href: r.path,
  }));

  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow={`${c.categoryLabel} · ${c.industry}`}
        title={c.title}
        subtitle={c.summary}
        breadcrumbs={breadcrumbs}
        primaryHref="/technologies/contact"
        primaryLabel="Discuss a similar project"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="All case studies"
        highlights={c.tags.slice(0, 3).map((t) => `Focus area: ${t}`)}
      >
        <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-xl">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3" aria-hidden /> Published
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {new Date(c.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3" aria-hidden /> Duration
            </dt>
            <dd className="mt-1 text-sm text-ink">{c.durationMonths} months</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3" aria-hidden /> Team
            </dt>
            <dd className="mt-1 text-sm text-ink">{c.teamSize}</dd>
          </div>
          {engagement && (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Engagement
              </dt>
              <dd className="mt-1 text-sm text-ink">
                <Link to={engagement.path} className="hover:text-tech transition-colors">
                  {engagement.eyebrow}
                </Link>
              </dd>
            </div>
          )}
        </dl>
      </ServiceHero>

      <StickyTabNav items={SECTIONS} />

      <Section id="summary">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.3fr] lg:items-end">
          <div>
            <Eyebrow brand="tech">Executive summary</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              The short version, for leaders.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty max-w-[62ch]">
            {c.executiveSummary}
          </p>
        </div>

        {c.metrics.length > 0 && (
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {c.metrics.map((m) => (
              <div key={m.label}>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </dt>
                <dd className="mt-2 font-display text-4xl md:text-5xl font-medium text-ink">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      <Section id="challenge" className="bg-muted/40">
        <Eyebrow brand="tech">Client challenge</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
          What was breaking, and why it mattered.
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {c.clientChallenge.map((q) => (
            <li key={q} className="rounded-2xl bg-card p-5 ring-1 ring-border text-sm leading-relaxed text-ink">
              {q}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="objectives">
        <Eyebrow brand="tech">Business objectives</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
          The outcomes leadership signed up to.
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {c.businessObjectives.map((o) => (
            <li key={o} className="flex gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-tech" aria-hidden />
              <span className="text-sm leading-relaxed text-ink">{o}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="solution" className="bg-muted/40">
        <Eyebrow brand="tech">Proposed solution</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
          The approach we recommended and shipped.
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {c.proposedSolution.map((s) => (
            <li key={s} className="rounded-2xl bg-card p-5 ring-1 ring-border text-sm leading-relaxed text-ink">
              {s}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="architecture">
        <Eyebrow brand="tech">Architecture overview</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
          A clear view of the moving parts.
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {c.architecture.map((a) => (
            <li key={a.layer} className="rounded-2xl bg-card p-5 ring-1 ring-border">
              <h3 className="font-display text-base font-medium text-ink">{a.layer}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="stack" className="bg-muted/40">
        <Eyebrow brand="tech">Technology stack</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
          Tools chosen to fit constraints, not fashion.
        </h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {c.techStack.map((g) => (
            <div key={g.group} className="rounded-2xl bg-card p-5 ring-1 ring-border">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-tech">
                {g.group}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {g.items.map((i) => (
                  <li key={i} className="rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-ink">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="process">
        <Eyebrow brand="tech">Development process</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
          How the work actually unfolded.
        </h2>
        <ProcessTimeline
          steps={c.developmentProcess.map((p) => ({ title: p.phase, body: p.body }))}
        />
      </Section>

      <Section id="results" className="bg-muted/40">
        <Eyebrow brand="tech">Results & business impact</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
          What changed in the business.
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {c.results.map((r) => (
            <li key={r} className="flex gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-tech" aria-hidden />
              <span className="text-sm leading-relaxed text-ink">{r}</span>
            </li>
          ))}
        </ul>

        {c.testimonial && (
          <figure className="mt-10 rounded-2xl bg-ink p-8 md:p-10 text-surface">
            <blockquote className="font-display text-xl md:text-2xl leading-snug text-balance">
              “{c.testimonial.quote}”
            </blockquote>
            <figcaption className="mt-6 text-sm text-surface/70">
              <span className="font-medium text-surface">{c.testimonial.author}</span> ·{" "}
              {c.testimonial.role}
              {c.testimonial.placeholder && (
                <span className="ml-2 rounded-md bg-surface/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                  TODO: client approval
                </span>
              )}
            </figcaption>
          </figure>
        )}
      </Section>

      <Section id="related">
        <Eyebrow brand="tech">Related</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[44ch]">
          Connected services, technologies, and case studies.
        </h2>

        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-tech">Services</h3>
            <ul className="mt-4 space-y-2">
              {relatedServices.map((s) => (
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
            <ul className="mt-4 grid grid-cols-2 gap-y-2">
              {relatedTech.map((t) => (
                <li key={t.slug}>
                  <Link to={t.path} className="text-sm text-ink hover:text-tech transition-colors">
                    {t.eyebrow} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-tech">Industry</h3>
            {relatedIndustry ? (
              <Link
                to={relatedIndustry.path}
                className="mt-4 block rounded-2xl bg-card p-5 ring-1 ring-border hover:ring-foreground/30"
              >
                <span className="font-display text-base font-medium text-ink">
                  {relatedIndustry.eyebrow}
                </span>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {relatedIndustry.subtitle ?? "Explore HIGAET's industry playbook."}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm text-tech">
                  Industry playbook <ArrowRight className="size-4" />
                </span>
              </Link>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{c.industry}</p>
            )}
          </div>
        </div>

        {relatedCards.length > 0 && (
          <div className="mt-12">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-tech">
              Related case studies
            </h3>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {relatedCards.map((rc) => (
                <CaseStudyCard key={rc.slug} caseStudy={rc} />
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section id="contact" className="bg-muted/40">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Eyebrow brand="tech">Discuss a similar project</Eyebrow>
            <h2 className="mt-4 max-w-[24ch] font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              Have a comparable initiative on your roadmap?
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-[48ch]">
              Share a few details and we'll come back within one business day with a recommended
              shape, indicative timeline, and the right HIGAET squad for the work.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8 [box-shadow:var(--shadow-card)]">
            <LeadForm division="tech" source={`case_${c.slug}`} />
          </div>
        </div>
      </Section>

      <CTASection
        eyebrow="HIGAET Technologies"
        title="Outcomes like these are reproducible."
        body="Tell us the goal and the constraints. We'll come back with a credible plan, not a brochure."
        primaryHref="/technologies/contact"
        primaryLabel="Start a conversation"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="Browse more case studies"
      />
    </>
  );
}
