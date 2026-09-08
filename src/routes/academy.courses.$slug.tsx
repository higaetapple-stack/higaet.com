import { createFileRoute, notFound, Link } from "@tanstack/react-router";
// eslint-disable-next-line no-restricted-imports -- detail page resolves a single course by slug; provider already exposes this via resolveCourseBySlug but the route needs the frozen registry shape directly for stable loader typing (approved, see ADR-0001)
import { ACADEMY_COURSES } from "@/content/academy/courses";
// eslint-disable-next-line no-restricted-imports -- category label for breadcrumb/eyebrow, same rationale
import { ACADEMY_CATEGORIES } from "@/content/academy/categories";
import type { CourseEntry } from "@/content/_registry/types";
import { seoHead } from "@/lib/seo/seo-head";
import { breadcrumbJsonLd } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { FAQ, faqJsonLd } from "@/components/site/FAQ";

function findCourse(slug: string): CourseEntry | undefined {
  return ACADEMY_COURSES.find((c) => c.slug === slug);
}

export const Route = createFileRoute("/academy/courses/$slug")({
  loader: ({ params }): { course: CourseEntry } => {
    const course = findCourse(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Course not found — HIGAET Academy" }] };
    const { course } = loaderData;
    const url = `/academy/courses/${params.slug}`;
    const category = ACADEMY_CATEGORIES.find((c) => c.id === course.categoryId);
    return seoHead({
      path: url,
      title: `${course.title} | HIGAET Academy`,
      description: course.summary,
      ogType: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.summary,
          provider: {
            "@type": "Organization",
            name: "HIGAET Academy",
            url: "https://www.higaet.com",
          },
          url: `https://www.higaet.com${url}`,
          ...(category ? { about: category.name } : {}),
        },
        ...(course.faqs?.length
          ? [faqJsonLd(course.faqs.map((f) => ({ q: f.question, a: f.answer })))]
          : []),
        breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Academy", href: "/academy" },
          { label: "Courses", href: "/academy/courses" },
          { label: course.title },
        ]),
      ],
    });
  },
  notFoundComponent: () => (
    <Section>
      <h1 className="font-display text-3xl">Course not found</h1>
      <p className="mt-3 text-muted-foreground">
        <Link to="/academy/courses" className="text-academy underline">
          Browse all courses
        </Link>
      </p>
    </Section>
  ),
  component: CourseDetail,
});

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const category = ACADEMY_CATEGORIES.find((c) => c.id === course.categoryId);

  return (
    <>
      <PageHero
        brand="academy"
        eyebrow={`Academy · ${category?.name ?? "Course"}`}
        title={course.title}
        subtitle={course.summary}
      >
        <dl className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {course.duration && (
            <span className="rounded-full border border-border bg-card px-3 py-1.5 text-ink">
              {course.duration}
            </span>
          )}
          {course.level && (
            <span className="rounded-full border border-border bg-card px-3 py-1.5 text-ink capitalize">
              {course.level}
            </span>
          )}
          {course.mode && (
            <span className="rounded-full border border-border bg-card px-3 py-1.5 text-ink capitalize">
              {course.mode}
            </span>
          )}
          {course.status === "comingSoon" && (
            <span className="rounded-full bg-amber-500/15 px-3 py-1.5 text-amber-800 font-medium">
              Coming soon
            </span>
          )}
        </dl>
      </PageHero>

      <Section className="!pt-0">
        <Breadcrumbs
          items={[
            { label: "Academy", href: "/academy" },
            { label: "Courses", href: "/academy/courses" },
            { label: course.title },
          ]}
          className="mb-8"
        />

        {course.outcomes?.length ? (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">What You Will Learn</h2>
            <ul className="mt-4 space-y-3">
              {(course.outcomes as readonly string[]).map((o: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-academy" aria-hidden />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {course.curriculum?.length ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">Curriculum</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Structured progression from foundations through practical training to capstone —
              experience-oriented, not just lectures.
            </p>
            <ol className="mt-6 space-y-3">
              {(course.curriculum as readonly string[]).map((m: string, i: number) => (
                <li
                  key={i}
                  className="flex gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3"
                >
                  <span className="font-mono text-xs font-semibold text-academy mt-0.5">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium text-ink">{m}</span>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-xl bg-academy/5 border border-academy/10 p-5">
              <h3 className="text-sm font-semibold text-ink">Practical Training Flow</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Learning → Guided Labs → Independent Practice → Industry Project → Capstone →
                Portfolio → Career Preparation. Practical hours are tracked alongside instructional
                hours and surfaced on the certificate.
              </p>
              <p className="mt-2 text-xs font-medium text-ink">
                Delivery as HIGAET Practical Training / Experiential Learning.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-base font-semibold text-ink">Skills & Technologies</h3>
            {course.metadata.keywords?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(course.metadata.keywords as readonly string[]).map((k: string) => (
                  <span
                    key={k}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {k}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Technologies are introduced progressively through labs, assignments, and the
                capstone.
              </p>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              {course.duration && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="font-medium text-ink">{course.duration}</dd>
                </div>
              )}
              {course.level && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Level</dt>
                  <dd className="font-medium text-ink capitalize">{course.level}</dd>
                </div>
              )}
              {course.mode && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd className="font-medium text-ink capitalize">{course.mode}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-ink">{course.status}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-base font-semibold text-ink">Career</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Courses are designed around portfolio artifacts — GitHub projects, capstone
              demonstrations, and interview-ready talking points — not attendance alone.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/academy/learning-paths"
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-muted"
              >
                View learning paths
              </Link>
              <Link
                to="/academy/courses"
                className="rounded-md bg-academy px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Browse all courses
              </Link>
            </div>
          </div>
        </div>

        {course.faqs?.length ? (
          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-ink">FAQs</h2>
            <div className="mt-4">
              <FAQ
                items={(course.faqs as readonly { question: string; answer: string }[]).map(
                  (f: { question: string; answer: string }) => ({ q: f.question, a: f.answer }),
                )}
              />
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
