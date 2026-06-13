import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { jsonLdScript } from "@/components/site/JsonLd";
import { breadcrumbJsonLd, type Crumb } from "@/components/site/Breadcrumbs";
import { COMPANY_PAGES } from "@/content/company";

const PATH = "/technologies/company";
const breadcrumbs: Crumb[] = [
  { label: "HIGAET", href: "/" },
  { label: "Technologies", href: "/technologies" },
  { label: "Company", href: PATH },
];

export const Route = createFileRoute("/technologies/company")({
  head: () => ({
    meta: [
      { title: "Company | HIGAET Technologies" },
      {
        name: "description",
        content:
          "About HIGAET Technologies — mission, vision, values, leadership, methodology, quality, security, and delivery process.",
      },
      { property: "og:title", content: "Company | HIGAET Technologies" },
      {
        property: "og:description",
        content: "Inside HIGAET Technologies — how we are organised and how we work.",
      },
      { property: "og:url", content: PATH },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: PATH }],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "HIGAET Technologies",
        url: PATH,
        parentOrganization: { "@type": "Organization", name: "HIGAET" },
        description:
          "Enterprise software, AI, cloud, and data engineering arm of the HIGAET ecosystem.",
      }),
      jsonLdScript(breadcrumbJsonLd(breadcrumbs)),
    ],
  }),
  component: CompanyHub,
});

const GROUPS = ["About", "Why", "Process", "People"] as const;

function CompanyHub() {
  return (
    <>
      <PageHero
        brand="tech"
        eyebrow="HIGAET Technologies — Company"
        title="Inside HIGAET Technologies."
        subtitle="How we are organised, what we believe, and the practices that make our delivery hold up under enterprise pressure."
      />

      {GROUPS.map((g) => {
        const pages = COMPANY_PAGES.filter((p) => p.group === g);
        if (pages.length === 0) return null;
        return (
          <Section key={g} className="!pt-0">
            <Eyebrow brand="tech">{g}</Eyebrow>
            <h2 className="mt-3 mb-8 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              {g === "About"
                ? "Who we are"
                : g === "Why"
                  ? "Why HIGAET Technologies"
                  : g === "Process"
                    ? "How we deliver"
                    : "Our people"}
            </h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {pages.map((p) => (
                <Link
                  key={p.slug}
                  to={p.path}
                  className="block rounded-2xl bg-card p-6 ring-1 ring-border hover:ring-foreground/30 transition"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-tech">
                    {p.eyebrow}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-medium text-ink leading-snug">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{p.intro}</p>
                </Link>
              ))}
            </div>
          </Section>
        );
      })}

      <CTASection
        eyebrow="HIGAET Technologies"
        title="Ready to talk to our team?"
        body="Share the problem and the constraints. We'll come back with a credible plan and the right squad."
        primaryHref="/technologies/contact"
        primaryLabel="Start a conversation"
        secondaryHref="/technologies/careers"
        secondaryLabel="Explore careers"
      />
    </>
  );
}
