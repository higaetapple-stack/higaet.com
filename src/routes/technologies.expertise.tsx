import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ServiceHero } from "@/components/site/ServiceHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { breadcrumbJsonLd, type Crumb } from "@/components/site/Breadcrumbs";
import { jsonLdScript } from "@/components/site/JsonLd";
import { ALL_TECHNOLOGIES, TECH_CATEGORIES } from "@/content/technologies.index";

const TITLE = "Technology Expertise — HIGAET Technologies";
const DESC =
  "Frontend, backend, mobile, database, cloud, and AI technologies HIGAET Technologies ships in production — across React, Node.js, Python, AWS, Kubernetes, OpenAI, and more.";
const PATH = "/technologies/expertise";

const breadcrumbs: Crumb[] = [
  { label: "HIGAET", href: "/" },
  { label: "Technologies", href: "/technologies" },
  { label: "Expertise", href: PATH },
];

export const Route = createFileRoute("/technologies/expertise")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: PATH },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: PATH }],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: TITLE,
        description: DESC,
        url: PATH,
      }),
      jsonLdScript(breadcrumbJsonLd(breadcrumbs)),
    ],
  }),
  component: ExpertiseIndex,
});

function ExpertiseIndex() {
  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow="Technology expertise"
        title="The technologies HIGAET ships in production."
        subtitle="Frontend, backend, mobile, data, cloud, and AI — engineered by senior squads against real production constraints."
        breadcrumbs={breadcrumbs}
        primaryHref="/technologies/contact"
        primaryLabel="Discuss your stack"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
        highlights={[
          "38 technology pages, one engineering org",
          "Cross-linked to services and industries",
          "Production patterns, not buzzword bingo",
          "Senior engineers across every layer",
        ]}
      />

      {TECH_CATEGORIES.map((cat, i) => (
        <Section key={cat.id} id={cat.id} className={i % 2 === 1 ? "bg-muted/40" : undefined}>
          <Eyebrow brand="tech">{cat.label}</Eyebrow>
          <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
            {cat.label} technologies we ship every quarter.
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cat.slugs
              .map((slug) => ALL_TECHNOLOGIES[slug])
              .filter(Boolean)
              .map((t) => (
                <Link
                  key={t.slug}
                  to={t.path}
                  className="group block rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-foreground/30 [box-shadow:var(--shadow-card)]"
                >
                  <h3 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
                    {t.eyebrow}
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.subtitle}</p>
                </Link>
              ))}
          </div>
        </Section>
      ))}

      <CTASection
        eyebrow="HIGAET Technologies"
        title="Bring HIGAET engineers into your stack."
        body="Tell us about your roadmap. We'll come back with a recommended team shape, lead engineer, and engagement model."
        primaryHref="/technologies/contact"
        primaryLabel="Start a project"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
      />
    </>
  );
}
