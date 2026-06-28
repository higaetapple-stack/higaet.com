import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { getCategory, type DocCategory } from "@/content/docs";
import { buildBreadcrumbJsonLd } from "@/lib/seo/course-schema";

const BASE = "https://higaet.com";

export const Route = createFileRoute("/docs/$category")({
  loader: ({ params }): { category: DocCategory } => {
    const category = getCategory(params.category);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Docs category not found — HIGAET" }] };
    const { category } = loaderData;
    const path = `/docs/${params.category}`;
    const url = `${BASE}${path}`;
    const title = `${category.name} — HIGAET Docs`;
    return {
      meta: [
        { title },
        { name: "description", content: category.description },
        { property: "og:title", content: title },
        { property: "og:description", content: category.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${url}#page`,
            url,
            name: title,
            description: category.description,
            hasPart: category.articles.map((a) => ({
              "@type": "TechArticle",
              headline: a.title,
              description: a.description,
              url: `${url}/${a.slug}`,
              dateModified: a.updated,
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Docs", url: "/docs" },
              { name: category.name, url: path },
            ]),
          ),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <Section>
      <h1 className="font-display text-3xl">Docs category not found</h1>
      <p className="mt-3 text-muted-foreground">
        <Link to="/docs" className="text-academy underline">Browse all docs</Link>
      </p>
    </Section>
  ),
  errorComponent: ({ error }) => (
    <Section>
      <h1 className="font-display text-2xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </Section>
  ),
  component: DocsCategoryPage,
});

function DocsCategoryPage() {
  const { category } = Route.useLoaderData() as { category: DocCategory };
  return (
    <SiteShell>
      <PageHero eyebrow="Docs" title={category.name} subtitle={category.description} />
      <Section>
        <ul className="grid gap-4 md:grid-cols-2">
          {category.articles.map((a) => (
            <li key={a.slug} className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <h2 className="font-display text-lg font-medium text-ink">
                <Link
                  to="/docs/$category/$slug"
                  params={{ category: category.slug, slug: a.slug }}
                  className="hover:text-academy"
                >
                  {a.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">Updated {a.updated}</p>
            </li>
          ))}
        </ul>
      </Section>
      <CTASection title="Looking for something else?" body="Browse other documentation categories." primaryHref="/docs" primaryLabel="All docs" />
    </SiteShell>
  );
}
