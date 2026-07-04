import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { FAQ } from "@/components/site/FAQ";
import { CTASection } from "@/components/site/CTASection";
import { getArticle, type DocArticle, type DocCategory } from "@/content/docs";
import { buildBreadcrumbJsonLd } from "@/lib/seo/course-schema";

const BASE = "https://www.higaet.com";

export const Route = createFileRoute("/docs/$category/$slug")({
  loader: ({ params }): { category: DocCategory; article: DocArticle } => {
    const result = getArticle(params.category, params.slug);
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Doc not found — HIGAET" }] };
    const { category, article } = loaderData;
    const path = `/docs/${params.category}/${params.slug}`;
    const url = `${BASE}${path}`;
    const title = `${article.title} — HIGAET Docs`;

    const techArticle = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "@id": `${url}#article`,
      headline: article.title,
      name: article.title,
      description: article.description,
      ...(article.summary ? { abstract: article.summary } : {}),
      url,
      dateModified: article.updated,
      inLanguage: "en",
      isPartOf: {
        "@type": "CreativeWorkSeries",
        name: category.name,
        url: `${BASE}/docs/${category.slug}`,
      },
      publisher: { "@id": "https://www.higaet.com/#organization" },
      ...(article.mentions && article.mentions.length
        ? { mentions: article.mentions.map((u) => ({ "@id": u, url: u })) }
        : {}),
    };

    const faq = article.faqs?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

    const scripts: { type: string; children: string }[] = [
      { type: "application/ld+json", children: JSON.stringify(techArticle) },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          buildBreadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Docs", url: "/docs" },
            { name: category.name, url: `/docs/${category.slug}` },
            { name: article.title, url: path },
          ]),
        ),
      },
    ];
    if (faq) scripts.push({ type: "application/ld+json", children: JSON.stringify(faq) });

    return {
      meta: [
        { title },
        { name: "description", content: article.description },
        { property: "og:title", content: title },
        { property: "og:description", content: article.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
      scripts,
    };
  },
  notFoundComponent: () => (
    <Section>
      <h1 className="font-display text-3xl">Doc not found</h1>
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
  component: DocArticlePage,
});

function DocArticlePage() {
  const { category, article } = Route.useLoaderData() as { category: DocCategory; article: DocArticle };
  return (
    <SiteShell>
      <PageHero eyebrow={category.name} title={article.title} subtitle={article.description} />
      <Section>
        <nav className="mb-6 text-xs text-muted-foreground">
          <Link to="/docs" className="hover:text-academy">Docs</Link>
          {" / "}
          <Link to="/docs/$category" params={{ category: category.slug }} className="hover:text-academy">{category.name}</Link>
        </nav>
        <article className="prose prose-lg max-w-3xl">
          {article.body.split(/\n\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <p className="text-xs text-muted-foreground">Last updated: {article.updated}</p>
        </article>
      </Section>
      {article.faqs && article.faqs.length > 0 && (
        <Section className="bg-muted/30">
          <FAQ items={article.faqs} eyebrow="FAQ" title="Related questions" />
        </Section>
      )}
      <CTASection
        title="Continue exploring HIGAET docs."
        body="Browse more guides in this category."
        primaryHref={`/docs/${category.slug}`}
        primaryLabel={`More in ${category.name}`}
        secondaryHref="/docs"
        secondaryLabel="All docs"
      />
    </SiteShell>
  );
}
