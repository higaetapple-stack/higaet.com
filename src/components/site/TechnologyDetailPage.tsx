import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ServiceHero } from "./ServiceHero";
import { StickyTabNav } from "./StickyTabNav";
import { Section, Eyebrow } from "./Section";
import { FeatureGrid, type Feature } from "./FeatureGrid";
import { ProcessTimeline, type ProcessStep } from "./ProcessTimeline";
import { FAQ, faqJsonLd, type QA } from "./FAQ";
import { breadcrumbJsonLd, type Crumb } from "./Breadcrumbs";
import { jsonLdScript } from "./JsonLd";
import { CTASection } from "./CTASection";
import { LeadForm } from "./LeadForm";
import { TechnologyCategoryNav } from "./TechnologyCategoryNav";
import { ALL_SERVICES } from "@/content/services.index";
import { ALL_INDUSTRIES } from "@/content/industries.index";

export type TechDetailContent = {
  slug: string;
  path: string;
  categoryId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  heroHighlights: string[];
  overviewTitle: string;
  overviewBody: string;
  whyChoose: { title: string; body: string }[];
  expertise: Feature[];
  useCases: { title: string; body: string }[];
  recommendedServices: string[];
  recommendedIndustries: string[];
  complementary: string[]; // tech slugs
  process: ProcessStep[];
  faqs: QA[];
  ctaTitle: string;
  ctaBody: string;
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "why", label: "Why this tech" },
  { id: "expertise", label: "Our expertise" },
  { id: "use-cases", label: "Use cases" },
  { id: "services", label: "Services" },
  { id: "industries", label: "Industries" },
  { id: "stack", label: "Stack fit" },
  { id: "process", label: "Process" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

export function buildTechnologyHead(c: TechDetailContent) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Expertise", href: "/technologies/expertise" },
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
        name: `${c.eyebrow} development services`,
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

export function TechnologyDetailPage({ content: c, complementaryLookup }: {
  content: TechDetailContent;
  complementaryLookup: Record<string, { slug: string; path: string; eyebrow: string; subtitle: string }>;
}) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Expertise", href: "/technologies/expertise" },
    { label: c.eyebrow, href: c.path },
  ];
  const services = c.recommendedServices.map((s) => ALL_SERVICES[s]).filter(Boolean);
  const industries = c.recommendedIndustries.map((s) => ALL_INDUSTRIES[s]).filter(Boolean);
  const complementary = c.complementary.map((s) => complementaryLookup[s]).filter(Boolean);

  return (
    <>
      <ServiceHero
        brand="tech"
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
            <Eyebrow brand="tech">Technology overview</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              {c.overviewTitle}
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty max-w-[60ch]">
            {c.overviewBody}
          </p>
        </div>
      </Section>

      <Section id="why" className="bg-muted/40">
        <Eyebrow brand="tech">Why choose {c.eyebrow}</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          Where {c.eyebrow} earns its place on the architecture diagram.
        </h2>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {c.whyChoose.map((b) => (
            <li key={b.title} className="rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-tech/10 text-tech">
                <CheckCircle2 className="size-5" aria-hidden />
              </div>
              <h3 className="font-display text-lg font-medium text-ink">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="expertise">
        <Eyebrow brand="tech">HIGAET expertise</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          How our squads work with {c.eyebrow} in production.
        </h2>
        <FeatureGrid features={c.expertise} columns={3} brand="tech" />
      </Section>

      <Section id="use-cases" className="bg-muted/40">
        <Eyebrow brand="tech">Common use cases</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
          Real applications we ship with {c.eyebrow}.
        </h2>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {c.useCases.map((u) => (
            <li key={u.title} className="rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]">
              <h3 className="font-display text-lg font-medium text-ink">{u.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{u.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {services.length > 0 && (
        <Section id="services">
          <Eyebrow brand="tech">Recommended services</Eyebrow>
          <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
            HIGAET Technologies services that lead with {c.eyebrow}.
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

      {industries.length > 0 && (
        <Section id="industries" className="bg-muted/40">
          <Eyebrow brand="tech">Industry applications</Eyebrow>
          <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
            Sectors where we apply {c.eyebrow} regularly.
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {industries.map((ind) => (
              <Link
                key={ind.slug}
                to={ind.path}
                className="group block rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-foreground/30 [box-shadow:var(--shadow-card)]"
              >
                <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
                  {ind.eyebrow}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{ind.subtitle}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {complementary.length > 0 && (
        <Section id="stack">
          <Eyebrow brand="tech">Complementary technologies</Eyebrow>
          <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
            What {c.eyebrow} typically ships alongside.
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {complementary.map((t) => (
              <Link
                key={t.slug}
                to={t.path}
                className="group block rounded-xl bg-card p-5 ring-1 ring-border transition hover:ring-foreground/30"
              >
                <h3 className="flex items-center gap-2 font-display text-base font-medium text-ink">
                  {t.eyebrow}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">{t.subtitle}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section id="process" className="bg-muted/40">
        <Eyebrow brand="tech">Delivery process</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[34ch]">
          How {c.eyebrow} fits into our delivery lifecycle.
        </h2>
        <ProcessTimeline steps={c.process} />
      </Section>

      <Section id="faq">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow brand="tech">FAQ</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              Common questions about {c.eyebrow}.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Need a specific opinion? Send your scenario and an engineer will respond.
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

      <TechnologyCategoryNav currentSlug={c.slug} />

      <Section id="contact" className="bg-muted/40">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Eyebrow brand="tech">Start a conversation</Eyebrow>
            <h2 className="mt-4 max-w-[22ch] font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              Bring HIGAET {c.eyebrow} engineers into your roadmap.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-[48ch]">
              Tell us about your initiative. We'll come back within one business day with a recommended
              engagement and team shape.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8 [box-shadow:var(--shadow-card)]">
            <LeadForm division="tech" source={`tech_${c.slug}`} />
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
