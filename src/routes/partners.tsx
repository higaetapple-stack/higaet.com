import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { PARTNERS } from "@/content/people";

const PATH = "/partners";
const URL = `https://higaet.com${PATH}`;
const TITLE = "Partners — HIGAET";
const DESC = "HIGAET's university, enterprise, cloud, and AI partner ecosystem.";

const JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${URL}#page`,
      url: URL,
      name: TITLE,
      description: DESC,
      breadcrumb: { "@id": `${URL}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${URL}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://higaet.com/" },
        { "@type": "ListItem", position: 2, name: "About HIGAET", item: "https://higaet.com/about-higaet" },
        { "@type": "ListItem", position: 3, name: "Partners", item: URL },
      ],
    },
    {
      "@type": "Organization",
      "@id": "https://higaet.com/about-higaet#org",
      name: "HIGAET",
      url: "https://higaet.com/about-higaet",
    },
  ],
};

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(JSONLD) }],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Partners"
        title="The HIGAET partner ecosystem."
        subtitle="Universities, enterprises, and cloud & AI providers that work with HIGAET across education, mobility, and engineering."
      />
      <Section>
        <ul className="grid gap-6 md:grid-cols-3">
          {PARTNERS.map((p) => (
            <li key={p.slug} className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <h3 className="font-display text-lg font-medium text-ink">{p.name}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted-foreground">
          Explore <Link to="/higaet-global-education-hub" className="text-academy underline">university partnerships</Link>,{" "}
          <Link to="/higaet-technologies" className="text-academy underline">enterprise engagements</Link>, and the{" "}
          <Link to="/higaet-ai-platform" className="text-academy underline">AI Platform</Link>.
        </p>
      </Section>
      <CTASection title="Partner with HIGAET." body="Talk to our team about university, enterprise, and cloud partnerships." />
    </SiteShell>
  );
}
