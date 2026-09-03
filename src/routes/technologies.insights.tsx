import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { jsonLdScript } from "@/components/site/JsonLd";
import { breadcrumbJsonLd, type Crumb } from "@/components/site/Breadcrumbs";
import {
  INSIGHTS,
  INSIGHT_CATEGORIES,
  INSIGHT_TAGS,
  CATEGORY_LABELS,
  type InsightCategory,
} from "@/content/insights";

export const insightsSearchSchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  q: z.string().optional(),
});

const PATH = "/technologies/insights";

const breadcrumbs: Crumb[] = [
  { label: "HIGAET", href: "/" },
  { label: "Technologies", href: "/technologies" },
  { label: "Insights", href: PATH },
];

export const Route = createFileRoute("/technologies/insights")({
  validateSearch: zodValidator(insightsSearchSchema),
  head: () => ({
    meta: [
      { title: "Insights & Knowledge Center | HIGAET Technologies" },
      {
        name: "description",
        content:
          "Original research, engineering playbooks, and industry insights from the HIGAET Technologies team on AI, cloud, data, and enterprise software.",
      },
      { property: "og:title", content: "Insights & Knowledge Center | HIGAET Technologies" },
      {
        property: "og:description",
        content:
          "Original research, engineering playbooks, and industry insights from HIGAET Technologies.",
      },
      { property: "og:url", content: PATH },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "HIGAET Technologies Insights",
        url: PATH,
        publisher: { "@type": "Organization", name: "HIGAET Technologies" },
        blogPost: INSIGHTS.map((i) => ({
          "@type": "BlogPosting",
          headline: i.title,
          url: i.path,
          datePublished: i.publishedAt,
        })),
      }),
      jsonLdScript(breadcrumbJsonLd(breadcrumbs)),
    ],
  }),
  component: InsightsHub,
});

function InsightsHub() {
  const { category, tag, q } = Route.useSearch();
  const cat = category as InsightCategory | undefined;
  const needle = (q ?? "").trim().toLowerCase();

  const filtered = INSIGHTS.filter((i) => {
    if (cat && i.category !== cat) return false;
    if (tag && !i.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())) return false;
    if (needle && !(i.title + " " + i.excerpt + " " + i.tags.join(" ")).toLowerCase().includes(needle))
      return false;
    return true;
  });

  const featured = INSIGHTS.filter((i) => i.featured);
  const latest = [...INSIGHTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <PageHero
        brand="tech"
        eyebrow="HIGAET Knowledge Center"
        title="Insights from people who ship enterprise software."
        subtitle="Engineering playbooks, architecture deep-dives, and industry analysis written by the HIGAET Technologies team — never generated, never paraphrased from elsewhere."
      />

      <Section className="!pt-0">
        <form className="flex flex-wrap items-end gap-3 border-b border-border pb-6">
          <label className="flex-1 min-w-[220px]">
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Search
            </span>
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="RAG, FinOps, modernization…"
              className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-tech"
            />
          </label>
          <label>
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Category
            </span>
            <select
              name="category"
              defaultValue={cat ?? ""}
              className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink"
            >
              <option value="">All</option>
              {INSIGHT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Tag
            </span>
            <select
              name="tag"
              defaultValue={tag ?? ""}
              className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink"
            >
              <option value="">All</option>
              {INSIGHT_TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface hover:opacity-90"
          >
            Apply
          </button>
          <Link
            to={PATH}
            search={{ category: undefined, tag: undefined, q: undefined }}
            className="text-xs text-muted-foreground hover:text-ink"
          >
            Reset
          </Link>
        </form>
      </Section>

      {featured.length > 0 && !cat && !tag && !needle && (
        <Section className="!pt-0">
          <Eyebrow brand="tech">Featured</Eyebrow>
          <h2 className="mt-4 mb-8 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[40ch]">
            Hand-picked reading.
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((i) => (
              <Link
                key={i.slug}
                to={i.path}
                className="group block rounded-2xl bg-card p-8 ring-1 ring-border hover:ring-foreground/30 transition"
              >
                <span className="text-[11px] font-semibold uppercase tracking-widest text-tech">
                  {CATEGORY_LABELS[i.category]}
                </span>
                <h3 className="mt-4 font-display text-2xl font-medium text-ink leading-snug text-balance">
                  {i.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{i.excerpt}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink group-hover:translate-x-1 transition-transform">
                  Read article <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section className="!pt-0">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <Eyebrow brand="tech">
              {cat || tag || needle ? "Filtered" : "Latest articles"}
            </Eyebrow>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              {filtered.length} article{filtered.length === 1 ? "" : "s"}
            </h2>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground">
            Nothing matches that filter yet. Try clearing the filters or contacting our team for a specific topic.
          </p>
        ) : (
          <ul className="grid gap-px bg-border ring-1 ring-border rounded-2xl overflow-hidden">
            {(cat || tag || needle ? filtered : latest).map((i) => (
              <li key={i.slug} className="bg-card">
                <Link to={i.path} className="group block p-7 md:p-8 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="font-semibold uppercase tracking-widest text-tech">
                      {CATEGORY_LABELS[i.category]}
                    </span>
                    <span>·</span>
                    <time dateTime={i.publishedAt}>
                      {new Date(i.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </time>
                    <span>·</span>
                    <span>{i.readingMinutes} min</span>
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-medium text-ink mb-2 text-balance">
                    {i.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-[68ch]">{i.excerpt}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {i.tags.slice(0, 4).map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-ink">
                        #{t}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CTASection
        eyebrow="HIGAET Technologies"
        title="Want our team to write on a topic you care about?"
        body="Tell us what your engineering, product, or platform team is wrestling with. If we have something useful to say, we'll publish it."
        primaryHref="/technologies/contact"
        primaryLabel="Suggest a topic"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
      />
    </>
  );
}
