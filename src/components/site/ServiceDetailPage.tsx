import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { ServiceHero } from "./ServiceHero";
import { StickyTabNav } from "./StickyTabNav";
import { Section, Eyebrow } from "./Section";
import { FeatureGrid, type Feature } from "./FeatureGrid";
import { TechStackGrid, type TechGroup } from "./TechStackGrid";
import { IndustryGrid, type Industry } from "./IndustryCard";
import { ProcessTimeline, type ProcessStep } from "./ProcessTimeline";
import { FAQ, faqJsonLd, type QA } from "./FAQ";
import { breadcrumbJsonLd, type Crumb } from "./Breadcrumbs";
import { jsonLdScript } from "./JsonLd";
import { CTASection } from "./CTASection";
import { LeadForm } from "./LeadForm";
import { ServiceCategoryNav } from "./ServiceCategoryNav";
import type { LeadDivision } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export type RelatedService = {
  name: string;
  href: string;
  body: string;
};

export type ServiceDetailContent = {
  slug: string;
  path: string; // canonical path e.g. /technologies/custom-software-development
  brand?: "academy" | "global" | "tech";
  eyebrow: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  heroHighlights?: string[];
  overviewTitle: string;
  overviewBody: string;
  benefits: { title: string; body: string }[];
  features: Feature[];
  process: ProcessStep[];
  techGroups: TechGroup[];
  industries: Industry[];
  whyUs: Feature[];
  related: RelatedService[];
  faqs: QA[];
  ctaTitle: string;
  ctaBody: string;
  leadDivision?: LeadDivision;
  leadSource?: string;
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "benefits", label: "Benefits" },
  { id: "features", label: "Features" },
  { id: "process", label: "Process" },
  { id: "stack", label: "Tech stack" },
  { id: "industries", label: "Industries" },
  { id: "why", label: "Why HIGAET" },
  { id: "related", label: "Related" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

/**
 * Build all head() entries (meta + links + JSON-LD scripts) for a service page.
 * Use from the route's head() so SEO/AEO/GEO metadata stays consistent.
 */
export function buildServiceHead(c: ServiceDetailContent) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
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
      { name: "twitter:title", content: c.metaTitle },
      { name: "twitter:description", content: c.metaDescription },
    ],
    links: [{ rel: "canonical", href: c.path }],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Service",
        name: c.eyebrow,
        serviceType: c.eyebrow,
        description: c.metaDescription,
        url: c.path,
        provider: { "@type": "Organization", name: "HIGAET Technologies", url: "/technologies" },
        areaServed: "Global",
      }),
      jsonLdScript(faqJsonLd(c.faqs)),
      jsonLdScript(breadcrumbJsonLd(breadcrumbs)),
    ],
  };
}

export function ServiceDetailPage({ content: c }: { content: ServiceDetailContent }) {
  const brand = c.brand ?? "tech";
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: c.eyebrow, href: c.path },
  ];

  return (
    <>
      <ServiceHero
        brand={brand}
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        breadcrumbs={breadcrumbs}
        primaryHref="/technologies/contact"
        primaryLabel="Talk to an engineer"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
        highlights={c.heroHighlights}
      />

      <StickyTabNav items={SECTIONS} />

      <Section id="overview">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.3fr] lg:items-end">
          <div>
            <Eyebrow brand={brand}>Overview</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              {c.overviewTitle}
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty max-w-[60ch]">
            {c.overviewBody}
          </p>
        </div>
      </Section>

      <Section id="benefits" className="bg-muted/40 !pt-16 !pb-20">
        <Eyebrow brand={brand}>Business benefits</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          Outcomes you can measure on the balance sheet.
        </h2>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {c.benefits.map((b) => (
            <li
              key={b.title}
              className="rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]"
            >
              <div
                className={cn(
                  "mb-4 flex size-10 items-center justify-center rounded-lg",
                  brand === "academy"
                    ? "bg-academy/10 text-academy"
                    : brand === "global"
                      ? "bg-global/10 text-global"
                      : "bg-tech/10 text-tech",
                )}
              >
                <CheckCircle2 className="size-5" aria-hidden />
              </div>
              <h3 className="font-display text-lg font-medium text-ink">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="features">
        <Eyebrow brand={brand}>Key capabilities</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          Everything you need from a senior delivery partner.
        </h2>
        <FeatureGrid features={c.features} columns={3} brand={brand} />
      </Section>

      <Section id="process" className="bg-muted/40">
        <Eyebrow brand={brand}>Our process</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          A predictable path from discovery to operate.
        </h2>
        <ProcessTimeline steps={c.process} />
      </Section>

      <Section id="stack">
        <Eyebrow brand={brand}>Technology stack</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          A modern toolbox, matched to your constraints.
        </h2>
        <TechStackGrid groups={c.techGroups} />
      </Section>

      <Section id="industries" className="bg-muted/40">
        <Eyebrow brand={brand}>Industries</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          Sectors where we ship this service every quarter.
        </h2>
        <IndustryGrid industries={c.industries} columns={3} />
      </Section>

      <Section id="why">
        <Eyebrow brand={brand}>Why HIGAET</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          The combination most agencies can't credibly offer.
        </h2>
        <FeatureGrid features={c.whyUs} columns={3} brand={brand} />
      </Section>

      <Section id="related" className="bg-muted/40">
        <Eyebrow brand={brand}>Related services</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          Pair this engagement with the rest of the HIGAET stack.
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {c.related.map((r) => (
            <Link
              key={r.name}
              to={r.href}
              className="group block rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-foreground/30 [box-shadow:var(--shadow-card)]"
            >
              <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
                {r.name}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="faq">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow brand={brand}>FAQ</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              Questions enterprise buyers usually ask.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Don't see your question? Send it through and the right engineer will reply.
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

      <Section id="contact" className="bg-muted/40">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Eyebrow brand={brand}>Start a project</Eyebrow>
            <h2 className="mt-4 max-w-[22ch] font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              Tell us about your {c.eyebrow.toLowerCase()} initiative.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-[48ch]">
              Share a few details and we'll come back within one business day with a recommended
              team shape, scope, and next steps.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8 [box-shadow:var(--shadow-card)]">
            <LeadForm
              division={c.leadDivision ?? "tech"}
              source={c.leadSource ?? `service_${c.slug}`}
            />
          </div>
        </div>
      </Section>

      <ServiceCategoryNav currentSlug={c.slug} />

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

// Re-export icon type for callers building Feature arrays inline.
export type ServiceIcon = ComponentType<LucideProps>;
