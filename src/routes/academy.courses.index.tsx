import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, BookOpen, Clock, GraduationCap, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/site/Breadcrumbs";
import { Input } from "@/components/ui/input";
// eslint-disable-next-line no-restricted-imports -- courses/index needs the full list client-side for live search/filter; the generated read-model is intentionally bypassed for UX (see ADR-0001, direct import approved for this surface)
import { ACADEMY_COURSES } from "@/content/academy/courses";
// eslint-disable-next-line no-restricted-imports -- same rationale as above
import { ACADEMY_CATEGORIES } from "@/content/academy/categories";
import type { CourseEntry, CategoryEntry } from "@/content/_registry/types";
import { academyCourseUrl } from "@/content/providers/academy-urls";
import { seoHead } from "@/lib/seo/seo-head";

function isPublicPublished(e: { status: string; visibility: string }) {
  return e.status === "published" && e.visibility === "public";
}

const COURSES: readonly CourseEntry[] = ACADEMY_COURSES.filter(isPublicPublished);
const CATEGORIES: readonly CategoryEntry[] = ACADEMY_CATEGORIES.filter(isPublicPublished);

export const Route = createFileRoute("/academy/courses/")({
  head: () =>
    seoHead({
      path: "/academy/courses",
      title: "HIGAET Academy Courses | Practical Technology Education",
      description:
        "Explore HIGAET Academy courses — practical, industry-focused technology courses designed for the Generative Intelligence era. Search by skill, technology, and career role.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "HIGAET Academy Courses",
          url: "https://www.higaet.com/academy/courses",
          isPartOf: { "@type": "WebSite", name: "HIGAET" },
          description:
            "HIGAET Academy courses — practical, industry-focused technology courses for the Generative Intelligence era.",
        },
        breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Academy", href: "/academy" },
          { label: "Courses" },
        ]),
      ],
    }),
  component: CoursesIndex,
});

type LevelFilter = "all" | "beginner" | "intermediate" | "advanced";

function CoursesIndex() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [level, setLevel] = useState<LevelFilter>("all");

  const catById = useMemo(() => new Map(CATEGORIES.map((c) => [c.id, c] as const)), []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return COURSES.filter((c) => {
      if (category !== "all" && c.categoryId !== category) return false;
      if (level !== "all" && c.level !== level) return false;
      if (!needle) return true;
      const cat = catById.get(c.categoryId);
      const hay = [
        c.title,
        c.summary,
        c.duration ?? "",
        c.level ?? "",
        c.mode ?? "",
        cat?.name ?? "",
        ...(c.metadata.keywords ?? []),
        ...(c.outcomes ?? []),
        ...(c.curriculum ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [q, category, level, catById]);

  return (
    <>
      <PageHero
        brand="academy"
        eyebrow="Academy · Courses"
        title="HIGAET Academy Courses"
        subtitle="Explore practical, industry-focused courses designed to build real-world technology skills for the Generative Intelligence era."
      />

      <Section className="!pt-0">
        <Breadcrumbs
          items={[{ label: "Academy", href: "/academy" }, { label: "Courses" }]}
          className="mb-8"
        />

        <div className="rounded-2xl border border-border bg-card p-4 md:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-0">
              <label htmlFor="course-search" className="sr-only">
                Search courses
              </label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="course-search"
                placeholder="Search — Python, Generative AI, DevOps, Cybersecurity…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="sr-only" htmlFor="filter-category">
                Category
              </label>
              <select
                id="filter-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as string)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="filter-level">
                Level
              </label>
              <select
                id="filter-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelFilter)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="all">All levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            Showing {filtered.length} of {COURSES.length} courses
            {q.trim() && <> · Search: “{q.trim()}”</>}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
            <BookOpen className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 font-medium text-ink">No courses match your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a broader search or reset the category and level filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setCategory("all");
                setLevel("all");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-academy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const cat = catById.get(c.categoryId);
              return (
                <article
                  key={c.id}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-academy/30 hover:shadow-md transition-colors"
                >
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-widest">
                    {cat && (
                      <span className="rounded-full bg-academy/10 px-2.5 py-1 text-academy">
                        {cat.name}
                      </span>
                    )}
                    {c.level && (
                      <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                        {c.level}
                      </span>
                    )}
                    {c.status === "comingSoon" && (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700">
                        Coming soon
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-lg font-semibold leading-snug text-ink mt-4 line-clamp-2">
                    {c.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {c.summary}
                  </p>

                  <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {c.duration && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden />
                        {c.duration}
                      </span>
                    )}
                    {c.mode && (
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="size-3.5" aria-hidden />
                        {c.mode}
                      </span>
                    )}
                  </dl>

                  <div className="mt-6">
                    <Link
                      to={academyCourseUrl(c.slug)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-academy px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                      aria-label={`View course: ${c.title}`}
                    >
                      View Course <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
