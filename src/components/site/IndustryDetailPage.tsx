import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { ServiceHero } from "./ServiceHero";
import { StickyTabNav } from "./StickyTabNav";
import { Section, Eyebrow } from "./Section";
import { FeatureGrid, type Feature } from "./FeatureGrid";
import { TechStackGrid, type TechGroup } from "./TechStackGrid";
import { ProcessTimeline, type ProcessStep } from "./ProcessTimeline";
import { FAQ, faqJsonLd, type QA } from "./FAQ";
import { breadcrumbJsonLd, type Crumb } from "./Breadcrumbs";
import { jsonLdScript } from "./JsonLd";
import { CTASection } from "./CTASection";
import { LeadForm } from "./LeadForm";
import { IndustryCategoryNav } from "./IndustryCategoryNav";
import { ALL_SERVICES } from "@/content/services.index";

export type IndustryDetailContent = {
  slug: string;
  path: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  heroHighlights?: string[];
  overviewTitle: string;
  overviewBody: string;
  challenges: { title: string; body: string }[];
  solutions: Feature[];
  /** Service slugs from the central registry, in priority order. */
  recommendedServices: string[];
  techGroups: TechGroup[];
  aiOpportunities: Feature[];
  process: ProcessStep[];
  benefits: { title: string; body: string }[];
  caseStudies?: { title: string; outcome: string; placeholder?: boolean }[];
  faqs: QA[];
  ctaTitle: string;
  ctaBody: string;
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "challenges", label: "Challenges" },
  { id: "solutions", label: "Solutions" },
  { id: "services", label: "Services" },
  { id: "ai", label: "AI" },
  { id: "stack", label: "Stack" },
  { id: "process", label: "Process" },
  { id: "benefits", label: "Benefits" },
  { id: "cases", label: "Cases" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export function buildIndustryHead(c: IndustryDetailContent) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Industries", href: "/technologies/industries" },
    { label: c.eyebrow, href: c.path },
  ];
  return {
    meta: [
      { title: c.metaTitle },
      { name: "description", content: c.metaDescription },
      { property: "og:title", content: c.metaTitle },
      { property: "og:description", content: c.metaDescription },
      { property: "og:url", content: c.path },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: c.metaTitle },
      { name: "twitter:description", content: c.metaDescription },
    ],
    links: [{ rel: "canonical", href: c.path }],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Service",
        name: `${c.eyebrow} technology solutions`,
        serviceType: c.eyebrow,
        description: c.metaDescription,
        url: c.path,
        provider: { "@type": "Organization", name: "HIGAET Technologies", url: "/technologies" },
        areaServed: "Global",
        audience: { "@type": "Audience", audienceType: c.eyebrow },
      }),
      jsonLdScript(faqJsonLd(c.faqs)),
      jsonLdScript(breadcrumbJsonLd(breadcrumbs)),
    ],
  };
}

export function IndustryDetailPage({ content: c }: { content: IndustryDetailContent }) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Industries", href: "/technologies/industries" },
    { label: c.eyebrow, href: c.path },
  ];
  const services = c.recommendedServices
    .map((slug) => ALL_SERVICES[slug])
    .filter(Boolean);

  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        breadcrumbs={breadcrumbs}
        primaryHref="/technologies/contact"
        primaryLabel="Discuss your initiative"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
        highlights={c.heroHighlights}
      />

      <StickyTabNav items={SECTIONS} />

      <Section id="overview">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.3fr] lg:items-end">
          <div>
            <Eyebrow brand="tech">Industry context</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              {c.overviewTitle}
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty max-w-[60ch]">
            {c.overviewBody}
          </p>
        </div>
      </Section>

      <Section id="challenges" className="bg-muted/40">
        <Eyebrow brand="tech">Industry challenges</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          The problems leaders in this sector are actually paying to solve.
        </h2>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {c.challenges.map((b) => (
            <li
              key={b.title}
              className="rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]"
            >
              <h3 className="font-display text-lg font-medium text-ink">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="solutions">
        <Eyebrow brand="tech">HIGAET solutions</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          How we engineer outcomes for this sector.
        </h2>
        <FeatureGrid features={c.solutions} columns={3} brand="tech" />
      </Section>

      {services.length > 0 && (
        <Section id="services" className="bg-muted/40">
          <Eyebrow brand="tech">Recommended services</Eyebrow>
          <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
            The HIGAET Technologies services we ship most for {c.eyebrow.toLowerCase()}.
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.slug}
                to={s.path}
                className="group block rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-foreground/30 [box-shadow:var(--shadow-card)]"
              >
                <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
                  {s.eyebrow}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.subtitle}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section id="ai">
        <Eyebrow brand="tech">AI opportunities</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          Where applied AI changes the economics in this sector.
        </h2>
        <FeatureGrid features={c.aiOpportunities} columns={3} brand="tech" />
      </Section>

      <Section id="stack" className="bg-muted/40">
        <Eyebrow brand="tech">Technology stack</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          The toolbox we typically deploy here.
        </h2>
        <TechStackGrid groups={c.techGroups} />
      </Section>

      <Section id="process">
        <Eyebrow brand="tech">Delivery process</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          A delivery methodology tuned for this industry.
        </h2>
        <ProcessTimeline steps={c.process} />
      </Section>

      <Section id="benefits" className="bg-muted/40">
        <Eyebrow brand="tech">Measurable benefits</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          Outcomes that show up on the P&amp;L and the customer experience.
        </h2>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {c.benefits.map((b) => (
            <li
              key={b.title}
              className="rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-tech/10 text-tech">
                <CheckCircle2 className="size-5" aria-hidden />
              </div>
              <h3 className="font-display text-lg font-medium text-ink">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="cases">
        <Eyebrow brand="tech">Featured case studies</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          Sector outcomes we&apos;ve delivered or are building toward.
        </h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(c.caseStudies ?? []).map((cs) => (
            <article
              key={cs.title}
              className="rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]"
            >
              {cs.placeholder && (
                <span className="mb-3 inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  TODO — production asset
                </span>
              )}
              <h3 className="font-display text-lg font-medium text-ink">{cs.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{cs.outcome}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="faq" className="bg-muted/40">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow brand="tech">FAQ</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              Common questions from {c.eyebrow.toLowerCase()} leaders.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Have a specific scenario? Reach out and the right HIGAET sector lead will respond.
            </p>
            <Link
              to="/technologies/contact"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-tech"
            >
              Ask the team <ArrowRight className="size-4" />
            </Link>
          </div>
          <FAQ items={c.faqs} />
        </div>
      </Section>

      <IndustryCategoryNav currentSlug={c.slug} />

      <Section id="contact">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Eyebrow brand="tech">Start a conversation</Eyebrow>
            <h2 className="mt-4 max-w-[22ch] font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              Bring HIGAET into your {c.eyebrow.toLowerCase()} roadmap.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-[48ch]">
              Share a few details. We&apos;ll come back within one business day with a recommended
              engagement and the right sector lead.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8 [box-shadow:var(--shadow-card)]">
            <LeadForm division="tech" source={`industry_${c.slug}`} />
          </div>
        </div>
      </Section>

      <CTASection
        eyebrow="HIGAET Technologies"
        title={c.ctaTitle}
        body={c.ctaBody}
        primaryHref="/technologies/contact"
        primaryLabel="Start a project"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
      />
    </>
  );
}

export type IndustryIcon = ComponentType<LucideProps>;
