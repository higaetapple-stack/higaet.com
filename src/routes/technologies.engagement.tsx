import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ServiceHero } from "@/components/site/ServiceHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { EngagementModelCard, type EngagementModel } from "@/components/site/EngagementModelCard";
import { breadcrumbJsonLd, type Crumb } from "@/components/site/Breadcrumbs";
import { jsonLdScript } from "@/components/site/JsonLd";
import { ENGAGEMENT_MODELS, ENGAGEMENT_SLUGS } from "@/content/engagement";

const META_TITLE = "Engagement Models | HIGAET Technologies";
const META_DESC =
  "Compare HIGAET Technologies engagement models — Dedicated Team, Staff Augmentation, Fixed Price, Time & Materials, Offshore Development Center, and Build-Operate-Transfer.";

const CRUMBS: Crumb[] = [
  { label: "HIGAET", href: "/" },
  { label: "Technologies", href: "/technologies" },
  { label: "Engagement Models", href: "/technologies/engagement" },
];

export const Route = createFileRoute("/technologies/engagement")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: "/technologies/engagement" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/technologies/engagement" }],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "HIGAET Technologies Engagement Models",
        description: META_DESC,
        url: "/technologies/engagement",
      }),
      jsonLdScript(breadcrumbJsonLd(CRUMBS)),
    ],
  }),
  component: EngagementHub,
});

function EngagementHub() {
  const cards: EngagementModel[] = ENGAGEMENT_SLUGS.map((slug, i) => {
    const m = ENGAGEMENT_MODELS[slug];
    return {
      name: m.eyebrow,
      tagline: m.tagline,
      bestFor: m.bestFor,
      features: m.heroHighlights,
      href: m.path,
      ctaLabel: "Explore model",
      highlighted: i === 0,
    };
  });

  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow="Engagement Models"
        title="Pick the way of working that matches your risk and roadmap."
        subtitle="From a fully managed offshore center to a single embedded engineer, HIGAET supports six proven engagement models — and helps you choose between them honestly."
        breadcrumbs={CRUMBS}
        primaryHref="/technologies/contact"
        primaryLabel="Discuss your options"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
        highlights={[
          "6 production-grade models",
          "Transparent commercials",
          "Switch models as you grow",
        ]}
      />

      <Section>
        <Eyebrow brand="tech">Compare models</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
          Six engagement models, one delivery operating system.
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((m) => (
            <EngagementModelCard key={m.name} model={m} />
          ))}
        </div>
      </Section>

      <Section className="bg-muted/40">
        <Eyebrow brand="tech">How to choose</Eyebrow>
        <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[42ch]">
          A practical decision guide.
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { q: "Multi-quarter roadmap, evolving scope?", a: "Dedicated Development Team or Time & Materials.", href: "/technologies/engagement/dedicated-development-team" },
            { q: "Defined outcome with hard date and budget?", a: "Fixed Price Projects.", href: "/technologies/engagement/fixed-price-projects" },
            { q: "Need targeted senior capacity for a window?", a: "Staff Augmentation.", href: "/technologies/engagement/staff-augmentation" },
            { q: "Scaling to 10+ engineers offshore?", a: "Offshore Development Center.", href: "/technologies/engagement/offshore-development-center" },
            { q: "Want an owned offshore team eventually?", a: "Build–Operate–Transfer.", href: "/technologies/engagement/build-operate-transfer" },
            { q: "Discovery, R&D, or rapid iteration?", a: "Time & Materials.", href: "/technologies/engagement/time-and-materials" },
          ].map((row) => (
            <Link
              key={row.q}
              to={row.href}
              className="group block rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-foreground/30"
            >
              <p className="font-display text-base font-medium text-ink">{row.q}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-tech">
                {row.a}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <CTASection
        eyebrow="HIGAET Technologies"
        title="Not sure which model fits? Tell us the goal."
        body="Share your roadmap, constraints, and end-state intent. We'll come back with a recommended engagement model — honestly, even if that means a different vendor."
        primaryHref="/technologies/contact"
        primaryLabel="Talk to the team"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
      />
    </>
  );
}
