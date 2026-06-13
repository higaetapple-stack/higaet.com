import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ServiceHero } from "./ServiceHero";
import { StickyTabNav } from "./StickyTabNav";
import { Section, Eyebrow } from "./Section";
import { ProcessTimeline } from "./ProcessTimeline";
import { FAQ, faqJsonLd } from "./FAQ";
import { breadcrumbJsonLd, type Crumb } from "./Breadcrumbs";
import { jsonLdScript } from "./JsonLd";
import { CTASection } from "./CTASection";
import { LeadForm } from "./LeadForm";
import { EngagementCategoryNav } from "./EngagementCategoryNav";
import type { EngagementContent } from "@/content/engagement";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "when", label: "When to choose" },
  { id: "benefits", label: "Benefits" },
  { id: "process", label: "Process" },
  { id: "team", label: "Team" },
  { id: "delivery", label: "Delivery" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export function buildEngagementHead(c: EngagementContent) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Engagement Models", href: "/technologies/engagement" },
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
        serviceType: "Engagement Model",
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

export function EngagementDetailPage({ content: c }: { content: EngagementContent }) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Engagement Models", href: "/technologies/engagement" },
    { label: c.eyebrow, href: c.path },
  ];

  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow={`Engagement Model · ${c.eyebrow}`}
        title={c.title}
        subtitle={c.subtitle}
        breadcrumbs={breadcrumbs}
        primaryHref="/technologies/contact"
        primaryLabel="Discuss this model"
        secondaryHref="/technologies/engagement"
        secondaryLabel="Compare models"
        highlights={c.heroHighlights}
      />

      <StickyTabNav items={SECTIONS} />

      <Section id="overview">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.3fr] lg:items-end">
          <div>
            <Eyebrow brand="tech">Overview</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              {c.tagline}
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-medium text-ink">Best for: </span>
              {c.bestFor}
            </p>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty max-w-[62ch]">
            {c.overview}
          </p>
        </div>
      </Section>

      <Section id="when" className="bg-muted/40">
        <Eyebrow brand="tech">When to choose</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          The right fit looks like this.
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {c.whenToChoose.map((w) => (
            <li key={w} className="flex gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-tech" aria-hidden />
              <span className="text-sm leading-relaxed text-ink">{w}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="benefits">
        <Eyebrow brand="tech">Benefits</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          What you actually get in return.
        </h2>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {c.benefits.map((b) => (
            <li key={b.title} className="rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]">
              <h3 className="font-display text-lg font-medium text-ink">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="process" className="bg-muted/40">
        <Eyebrow brand="tech">Engagement process</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          From first call to steady-state delivery.
        </h2>
        <ProcessTimeline steps={c.process} />
      </Section>

      <Section id="team">
        <Eyebrow brand="tech">Team structure</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          Who you actually work with.
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {c.teamStructure.map((t) => (
            <li key={t.role} className="rounded-2xl bg-card p-5 ring-1 ring-border">
              <h3 className="font-display text-base font-medium text-ink">{t.role}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="delivery" className="bg-muted/40">
        <Eyebrow brand="tech">Delivery workflow</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          How the work actually flows.
        </h2>
        <ul className="grid gap-3">
          {c.delivery.map((d) => (
            <li key={d} className="flex gap-3 rounded-xl bg-card px-5 py-4 ring-1 ring-border">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-tech" aria-hidden />
              <span className="text-sm leading-relaxed text-ink">{d}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="pricing">
        <Eyebrow brand="tech">Pricing approach</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          Transparent commercials, no surprises.
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {c.pricing.map((p) => (
            <li key={p.model} className="rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]">
              <h3 className="font-display text-base font-medium text-ink">{p.model}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="related" className="bg-muted/40">
        <Eyebrow brand="tech">Related services</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          Combine this engagement with our delivery practices.
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
            <Eyebrow brand="tech">FAQ</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              Questions enterprise buyers usually ask.
            </h2>
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
            <Eyebrow brand="tech">Start a conversation</Eyebrow>
            <h2 className="mt-4 max-w-[24ch] font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              Discuss the {c.eyebrow} model for your roadmap.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-[48ch]">
              Share a few details and we'll respond within one business day with a recommended shape, indicative economics, and next steps.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8 [box-shadow:var(--shadow-card)]">
            <LeadForm division="tech" source={`engagement_${c.slug}`} />
          </div>
        </div>
      </Section>

      <EngagementCategoryNav currentSlug={c.slug} />

      <CTASection
        eyebrow="HIGAET Technologies"
        title={c.ctaTitle}
        body={c.ctaBody}
        primaryHref="/technologies/contact"
        primaryLabel="Talk to the team"
        secondaryHref="/technologies/engagement"
        secondaryLabel="Compare models"
      />
    </>
  );
}
