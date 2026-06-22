import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { DOC_CATEGORIES } from "@/content/docs";
import { buildBreadcrumbJsonLd } from "@/lib/seo/course-schema";

const PATH = "/docs";
const URL = `https://higaet.com${PATH}`;
const TITLE = "HIGAET Documentation";
const DESC = "Documentation across HIGAET Academy, Global Education Hub, AI Platform, APIs, and AI engineering guides.";

const COLLECTION = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${URL}#page`,
  url: URL,
  name: TITLE,
  description: DESC,
  isPartOf: { "@id": "https://higaet.com/#organization" },
  hasPart: DOC_CATEGORIES.map((c) => ({
    "@type": "CreativeWorkSeries",
    name: c.name,
    description: c.description,
    url: `${URL}/${c.slug}`,
  })),
};

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(COLLECTION) },
      { type: "application/ld+json", children: JSON.stringify(buildBreadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Docs", url: PATH },
      ])) },
    ],
  }),
  component: DocsIndex,
});

function DocsIndex() {
  return (
    <SiteShell>
      <PageHero eyebrow="Documentation" title="HIGAET Documentation" subtitle={DESC} />
      <Section>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DOC_CATEGORIES.map((c) => (
            <li key={c.slug} className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <h2 className="font-display text-lg font-medium text-ink">
                <Link to="/docs/$category" params={{ category: c.slug }} className="hover:text-academy">
                  {c.name}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">{c.articles.length} article{c.articles.length === 1 ? "" : "s"}</p>
            </li>
          ))}
        </ul>
      </Section>
      <CTASection title="Need something specific?" body="Ask a question and we'll point you at the right doc or guide." />
    </SiteShell>
  );
}
