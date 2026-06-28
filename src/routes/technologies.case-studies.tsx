import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ServiceHero } from "@/components/site/ServiceHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { CaseStudyCard, type CaseStudy } from "@/components/site/CaseStudyCard";
import { breadcrumbJsonLd, type Crumb } from "@/components/site/Breadcrumbs";
import { jsonLdScript } from "@/components/site/JsonLd";
import {
  CASE_STUDIES,
  CASE_STUDY_CATEGORIES,
  type CaseStudyContent,
} from "@/content/case-studies";
import { ALL_SERVICES } from "@/content/services.index";
import { ALL_INDUSTRIES } from "@/content/industries.index";
import { ALL_TECHNOLOGIES } from "@/content/technologies.index";

const PAGE_SIZE = 6;
const META_TITLE = "Technology Case Studies | HIGAET Technologies";
const META_DESC =
  "Browse HIGAET Technologies case studies across AI, SaaS, custom software, cloud, data, mobile, and digital transformation — filter by industry, service, or technology.";

const CRUMBS: Crumb[] = [
  { label: "HIGAET", href: "/" },
  { label: "Technologies", href: "/technologies" },
  { label: "Case Studies", href: "/technologies/case-studies" },
];

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
  industry: fallback(z.string(), "").default(""),
  service: fallback(z.string(), "").default(""),
  tech: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/technologies/case-studies")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: "https://higaet.com/technologies/case-studies" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/technologies/case-studies" }],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "HIGAET Technologies Case Studies",
        description: META_DESC,
        url: "/technologies/case-studies",
      }),
      jsonLdScript(breadcrumbJsonLd(CRUMBS)),
    ],
  }),
  component: CaseStudiesHub,
});

function CaseStudiesHub() {
  const { q, category, industry, service, tech, page } = Route.useSearch();
  const all = useMemo(() => Object.values(CASE_STUDIES), []);

  // Build facet lists from the registry.
  const industryFacets = useMemo(() => {
    const set = new Map<string, string>();
    all.forEach((cs) => set.set(cs.industrySlug, cs.industry));
    return Array.from(set, ([slug, label]) => ({ slug, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [all]);

  const serviceFacets = useMemo(() => {
    const counts = new Map<string, number>();
    all.forEach((cs) => cs.serviceSlugs.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)));
    return Array.from(counts.keys())
      .filter((slug) => ALL_SERVICES[slug])
      .sort()
      .map((slug) => ({ slug, label: ALL_SERVICES[slug].eyebrow }));
  }, [all]);

  const techFacets = useMemo(() => {
    const counts = new Map<string, number>();
    all.forEach((cs) => cs.technologySlugs.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return Array.from(counts.keys())
      .filter((slug) => ALL_TECHNOLOGIES[slug])
      .sort()
      .map((slug) => ({ slug, label: ALL_TECHNOLOGIES[slug].eyebrow }));
  }, [all]);

  // Apply filters + search.
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return all.filter((cs) => {
      if (category && cs.category !== category) return false;
      if (industry && cs.industrySlug !== industry) return false;
      if (service && !cs.serviceSlugs.includes(service)) return false;
      if (tech && !cs.technologySlugs.includes(tech)) return false;
      if (qLower) {
        const hay = [cs.title, cs.summary, cs.industry, cs.categoryLabel, ...cs.tags]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
  }, [all, q, category, industry, service, tech]);

  const featured = useMemo(() => all.filter((cs) => cs.featured), [all]);
  const hasFilters = Boolean(q || category || industry || service || tech);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toCard = (cs: CaseStudyContent): CaseStudy => ({
    slug: cs.slug,
    industry: cs.industry,
    title: cs.title,
    summary: cs.summary,
    metrics: cs.metrics,
    stack: cs.tags.slice(0, 4),
    href: cs.path,
  });

  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow="Case Studies"
        title="Real engagements, measurable outcomes."
        subtitle="Browse HIGAET Technologies case studies across AI, SaaS, custom software, cloud, data, mobile, and digital transformation."
        breadcrumbs={CRUMBS}
        primaryHref="/technologies/contact"
        primaryLabel="Discuss a project"
        secondaryHref="/technologies/engagement"
        secondaryLabel="Engagement models"
        highlights={[
          `${all.length} published case studies`,
          "Filter by industry, service, technology",
          "Outcomes-first documentation",
        ]}
      />

      {!hasFilters && featured.length > 0 && (
        <Section>
          <Eyebrow brand="tech">Featured</Eyebrow>
          <h2 className="mt-4 mb-10 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[44ch]">
            Selected work our leadership team is most proud of.
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((cs) => (
              <CaseStudyCard key={cs.slug} caseStudy={toCard(cs)} />
            ))}
          </div>
        </Section>
      )}

      <Section id="browse" className="bg-muted/30 border-t border-border">
        <Eyebrow brand="tech">Browse all</Eyebrow>
        <h2 className="mt-4 mb-2 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[44ch]">
          Find a case study like the one you need to run.
        </h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {all.length} case studies match your filters.
        </p>

        {/* Search */}
        <form
          action="/technologies/case-studies"
          method="get"
          className="mt-8 flex flex-col gap-3 md:flex-row md:items-center"
        >
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search case studies (title, summary, tag)"
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2.5 text-sm text-ink placeholder:text-muted-foreground focus:border-tech focus:outline-none"
            />
          </label>
          {/* Preserve current filters when submitting search */}
          {category && <input type="hidden" name="category" value={category} />}
          {industry && <input type="hidden" name="industry" value={industry} />}
          {service && <input type="hidden" name="service" value={service} />}
          {tech && <input type="hidden" name="tech" value={tech} />}
          <button
            type="submit"
            className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-surface hover:bg-ink/90"
          >
            Search
          </button>
          {hasFilters && (
            <Link
              to="/technologies/case-studies"
              search={{ q: "", category: "", industry: "", service: "", tech: "", page: 1 }}
              className="inline-flex items-center gap-1.5 rounded-lg ring-1 ring-border px-4 py-2.5 text-sm font-medium text-ink hover:bg-muted"
            >
              <X className="size-4" /> Clear
            </Link>
          )}
        </form>

        {/* Filter rows */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-8">
            <FilterRow
              title="Category"
              active={category}
              param="category"
              options={CASE_STUDY_CATEGORIES.map((c) => ({ slug: c.id, label: c.label }))}
              current={{ q, category, industry, service, tech }}
            />
            <FilterRow
              title="Industry"
              active={industry}
              param="industry"
              options={industryFacets}
              current={{ q, category, industry, service, tech }}
            />
            <FilterRow
              title="Service"
              active={service}
              param="service"
              options={serviceFacets}
              current={{ q, category, industry, service, tech }}
            />
            <FilterRow
              title="Technology"
              active={tech}
              param="tech"
              options={techFacets}
              current={{ q, category, industry, service, tech }}
            />
          </aside>

          <div>
            {paged.length === 0 ? (
              <div className="rounded-2xl bg-card p-10 ring-1 ring-border text-center">
                <p className="text-base text-ink font-medium">No case studies match.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try removing a filter or searching for a different term.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paged.map((cs) => (
                  <CaseStudyCard key={cs.slug} caseStudy={toCard(cs)} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-between">
                <Link
                  to="/technologies/case-studies"
                  search={{ q, category, industry, service, tech, page: Math.max(1, safePage - 1) }}
                  rel="prev"
                  aria-disabled={safePage === 1}
                  className={
                    "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ring-1 transition " +
                    (safePage === 1
                      ? "pointer-events-none opacity-40 ring-border text-muted-foreground"
                      : "ring-border text-ink hover:bg-muted")
                  }
                >
                  <ChevronLeft className="size-4" /> Previous
                </Link>
                <span className="text-sm text-muted-foreground">
                  Page {safePage} of {totalPages}
                </span>
                <Link
                  to="/technologies/case-studies"
                  search={{ q, category, industry, service, tech, page: Math.min(totalPages, safePage + 1) }}
                  rel="next"
                  aria-disabled={safePage === totalPages}
                  className={
                    "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ring-1 transition " +
                    (safePage === totalPages
                      ? "pointer-events-none opacity-40 ring-border text-muted-foreground"
                      : "ring-border text-ink hover:bg-muted")
                  }
                >
                  Next <ChevronRight className="size-4" />
                </Link>
              </nav>
            )}
          </div>
        </div>
      </Section>

      <CTASection
        eyebrow="HIGAET Technologies"
        title="Have a project that belongs in this library?"
        body="Tell us the goal, the constraints, and the timeline. We'll come back with a credible plan within one business day."
        primaryHref="/technologies/contact"
        primaryLabel="Start a conversation"
        secondaryHref="/technologies/engagement"
        secondaryLabel="Compare engagement models"
      />
    </>
  );
}

function FilterRow({
  title,
  active,
  param,
  options,
  current,
}: {
  title: string;
  active: string;
  param: "category" | "industry" | "service" | "tech";
  options: { slug: string; label: string }[];
  current: { q: string; category: string; industry: string; service: string; tech: string };
}) {
  if (options.length === 0) return null;
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-3 flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
        <li>
          <Link
            to="/technologies/case-studies"
            search={{ ...current, [param]: "", page: 1 }}
            className={
              "block rounded-md px-2.5 py-1 text-sm transition " +
              (!active ? "bg-ink text-surface" : "text-muted-foreground hover:text-ink hover:bg-muted")
            }
          >
            All
          </Link>
        </li>
        {options.map((opt) => {
          const isActive = active === opt.slug;
          return (
            <li key={opt.slug}>
              <Link
                to="/technologies/case-studies"
                search={{ ...current, [param]: opt.slug, page: 1 }}
                aria-current={isActive ? "page" : undefined}
                className={
                  "block rounded-md px-2.5 py-1 text-sm transition " +
                  (isActive
                    ? "bg-ink text-surface"
                    : "text-muted-foreground hover:text-ink hover:bg-muted")
                }
              >
                {opt.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
