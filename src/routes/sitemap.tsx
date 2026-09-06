import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { seoHead } from "@/lib/seo/seo-head";
import { breadcrumbJsonLd } from "@/components/site/Breadcrumbs";
import { SITEMAP_BASE, getHtmlSitemapSections, type HtmlSitemapSection } from "@/lib/sitemap";

const SITEMAP_PATH = "/sitemap";
const SITEMAP_URL = `${SITEMAP_BASE}/sitemap`;
const SITEMAP_TITLE = "HIGAET Sitemap | Helen Institute of Gen AI Engineering & Technology";
const SITEMAP_DESC =
  "Explore the HIGAET sitemap to discover HIGAET Academy, Global Education Hub, HIGAET Technologies, programs, resources, blogs, careers, campuses, company information, and other public pages.";

export const Route = createFileRoute("/sitemap")({
  loader: async () => ({
    sections: await getHtmlSitemapSections(),
  }),
  head: async () => {
    const sections = await getHtmlSitemapSections();
    const total = sections.reduce((n, s) => n + s.links.length, 0);
    return seoHead({
      path: SITEMAP_PATH,
      title: SITEMAP_TITLE,
      description: `${SITEMAP_DESC} (${total} public pages.)`,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${SITEMAP_URL}#page`,
          name: "HIGAET Sitemap",
          description: SITEMAP_DESC,
          url: SITEMAP_URL,
          isPartOf: { "@id": "https://www.higaet.com/#organization" },
        },
        breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Sitemap" }]),
      ],
    });
  },
  component: SitemapPage,
});

function toPath(loc: string): string {
  return loc.startsWith(SITEMAP_BASE) ? loc.slice(SITEMAP_BASE.length) || "/" : loc;
}

function SitemapPage() {
  const { sections } = Route.useLoaderData() as { sections: HtmlSitemapSection[] };
  const total = sections.reduce((n, s) => n + s.links.length, 0);
  return (
    <SiteShell>
      <PageHero
        eyebrow="Sitemap"
        title="Explore every corner of HIGAET."
        subtitle={`Browse all ${total} public pages across HIGAET Academy, Global Education Hub, and HIGAET Technologies.`}
      />
      <Section className="!pt-0">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <SitemapSectionCard key={section.title} section={section} />
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}

function SitemapSectionCard({ section }: { section: HtmlSitemapSection }) {
  return (
    <article className="p-8 rounded-2xl bg-card ring-1 ring-border">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="font-display text-2xl font-medium text-ink">{section.title}</h2>
        <span className="text-xs text-muted-foreground">{section.links.length}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{section.blurb}</p>
      <ul className="space-y-2.5">
        {section.links.map((l) => (
          <li key={l.loc}>
            <Link
              to={toPath(l.loc)}
              className="text-sm font-medium text-ink hover:text-tech transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
