import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ServiceHero } from "@/components/site/ServiceHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { breadcrumbJsonLd, type Crumb } from "@/components/site/Breadcrumbs";
import { jsonLdScript } from "@/components/site/JsonLd";
import { ALL_INDUSTRIES, INDUSTRY_CATEGORIES } from "@/content/industries.index";

const TITLE = "Industries — HIGAET Technologies";
const DESC =
  "Industry-focused technology and AI solutions across finance, healthcare, retail, manufacturing, logistics, public sector, hospitality, real estate, and more — by HIGAET Technologies.";
const PATH = "/technologies/industries";

const breadcrumbs: Crumb[] = [
  { label: "HIGAET", href: "/" },
  { label: "Technologies", href: "/technologies" },
  { label: "Industries", href: PATH },
];

export const Route = createFileRoute("/technologies/industries")({
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
  component: IndustriesIndex,
});

function IndustriesIndex() {
  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow="Industries"
        title="HIGAET Technologies, by industry."
        subtitle="Sector-tuned software, AI, cloud, and data solutions for the industries we ship into every quarter."
        breadcrumbs={breadcrumbs}
        primaryHref="/technologies/contact"
        primaryLabel="Discuss your sector"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
        highlights={[
          "15 industry-tuned playbooks",
          "Senior squads with sector context",
          "Regulatory and compliance literate",
          "AI woven into every offer",
        ]}
      />

      {INDUSTRY_CATEGORIES.map((cat) => (
        <Section key={cat.id} id={cat.id} className={cat.id === "size" ? "bg-muted/40" : undefined}>
          <Eyebrow brand="tech">{cat.label}</Eyebrow>
          <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[36ch]">
            {cat.label} sectors we serve.
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cat.slugs
              .map((slug) => ALL_INDUSTRIES[slug])
              .filter(Boolean)
              .map((ind) => (
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
      ))}

      <CTASection
        eyebrow="HIGAET Technologies"
        title="Bring HIGAET into your sector."
        body="Tell us about your business and goals. We'll come back with a tailored engagement led by the right sector expert."
        primaryHref="/technologies/contact"
        primaryLabel="Start a project"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
      />
    </>
  );
}
