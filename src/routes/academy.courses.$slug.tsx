import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, GraduationCap, Users, ArrowRight } from "lucide-react";
// eslint-disable-next-line no-restricted-imports -- see detail-page ADR note in academy.courses.index.tsx
import { ACADEMY_COURSES } from "@/content/academy/courses";
// eslint-disable-next-line no-restricted-imports -- same rationale
import { ACADEMY_CATEGORIES } from "@/content/academy/categories";
import type { CourseEntry } from "@/content/_registry/types";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { LeadForm } from "@/components/site/LeadForm";
import { FAQ, faqJsonLd } from "@/components/site/FAQ";
import { seoHead } from "@/lib/seo/seo-head";
import { breadcrumbJsonLd } from "@/components/site/Breadcrumbs";

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
          ? [
              faqJsonLd(
                course.faqs.map((f: { question: string; answer: string }) => ({
                  q: f.question,
                  a: f.answer,
                })),
              ),
            ]
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
  const related = ACADEMY_COURSES.filter(
    (c) =>
      c.categoryId === course.categoryId &&
      c.slug !== course.slug &&
      c.status === "published" &&
      c.visibility === "public",
  ).slice(0, 3);

  return (
    <>
      <PageHero
        brand="academy"
        eyebrow={`Academy · ${category?.name ?? "Course"} · ${course.level ?? "All levels"}`}
        title={course.title}
        subtitle={course.summary}
      >
        <div className="grid max-w-3xl grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
          <Meta
            icon={Clock}
            label="Duration"
            value={
              course.duration
                ? course.hoursPerWeek
                  ? `${course.duration} · ${course.hoursPerWeek}`
                  : course.duration
                : (course.hoursPerWeek ?? "—")
            }
          />
          <Meta
            icon={GraduationCap}
            label="Level"
            value={
              course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : "—"
            }
          />
          <Meta
            icon={Users}
            label="Delivery"
            value={course.mode ? course.mode.charAt(0).toUpperCase() + course.mode.slice(1) : "—"}
          />
          <Meta
            icon={CheckCircle2}
            label="Status"
            value={course.status === "comingSoon" ? "Coming soon" : "Open for enrollment"}
          />
        </div>
      </PageHero>

      {/* Overview — standardized learning-system block: who it's for, prerequisites, toolbox */}
      {course.audience?.length || course.prerequisites?.length || course.technologies?.length ? (
        <Section className="!pt-0">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Eyebrow brand="academy">Overview</Eyebrow>
              <h2 className="mt-4 max-w-[20ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                Know exactly what you&apos;re signing up for.
              </h2>
            </div>
            <div className="space-y-8">
              {course.audience?.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Who is this for</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.audience.map((a: string) => (
                      <span
                        key={a}
                        className="rounded-full bg-academy/10 px-3 py-1 text-xs font-medium text-academy"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {course.prerequisites?.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Prerequisites</h3>
                  <ul className="mt-3 space-y-2">
                    {course.prerequisites.map((req: string) => (
                      <li key={req} className="flex gap-3 text-sm text-ink">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-academy" aria-hidden />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {course.technologies?.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Technologies &amp; tools</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.technologies.map((t: string) => (
                      <span
                        key={t}
                        className="rounded-md bg-muted/60 px-2.5 py-1 font-mono text-xs text-ink"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {course.skills?.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Skills you&apos;ll gain</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.skills.map((s: string) => (
                      <span
                        key={s}
                        className="rounded-md border border-border px-2.5 py-1 text-xs text-ink"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      {/* Curriculum — same Eyebrow + headline split as Program detail */}
      {course.curriculum?.length ? (
        <Section className="!pt-0">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Eyebrow brand="academy">Curriculum</Eyebrow>
              <h2 className="mt-4 max-w-[20ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                {course.duration
                  ? `A ${course.duration.toLowerCase()} arc, module by module.`
                  : "The curriculum, module by module."}
              </h2>
            </div>
            <ol className="space-y-6">
              {(course.curriculum as readonly string[]).map((m: string, i: number) => (
                <li key={i} className="rounded-xl bg-card p-6 ring-1 ring-border">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-academy">
                    Module {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-sm font-medium leading-snug text-ink">{m}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Practical Training flow — kept from original, now sits naturally under curriculum like Program's term cards */}
          <div className="mt-10 rounded-xl bg-academy/5 border border-academy/10 p-5 md:p-6">
            <h3 className="text-sm font-semibold text-ink">Practical Training Flow</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Learning → Guided Labs → Independent Practice → Industry Project → Capstone →
              Portfolio → Career Preparation. Practical hours are tracked alongside instructional
              hours and surfaced on the certificate.
            </p>
            <p className="mt-2 text-xs font-medium text-ink">
              Delivery as HIGAET Practical Training / Experiential Learning.
            </p>
            {course.metadata.keywords?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {(course.metadata.keywords as readonly string[]).map((k: string) => (
                  <span key={k} className="rounded-md bg-muted/60 px-2.5 py-1 text-xs text-ink">
                    {k}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* Outcomes — same grid + CheckCircle2 pattern as Program detail */}
      {course.outcomes?.length ? (
        <Section className="bg-muted/30">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Eyebrow brand="academy">Outcomes</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                What you&apos;ll be able to do.
              </h2>
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {(course.outcomes as readonly string[]).map((o: string) => (
                <li key={o} className="flex gap-3 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-academy" aria-hidden />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}

      {/* Projects — "You will build", same card language as curriculum modules */}
      {course.projects?.length ? (
        <Section className="bg-muted/30">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Eyebrow brand="academy">Projects</Eyebrow>
              <h2 className="mt-4 max-w-[20ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                You will build.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Every project ships as HIGAET Practical Training / Experiential Learning —
                portfolio-ready work, not exercises.
              </p>
            </div>
            <ol className="space-y-6">
              {course.projects.map((p: string, i: number) => {
                const isCapstone = p.toLowerCase().startsWith("capstone:");
                return (
                  <li key={i} className="rounded-xl bg-card p-6 ring-1 ring-border">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-academy">
                      {isCapstone ? "Capstone" : `Project ${String(i + 1).padStart(2, "0")}`}
                    </span>
                    <p className="mt-2 text-sm font-medium leading-snug text-ink">
                      {isCapstone ? p.replace(/^[Cc]apstone:\s*/, "") : p}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </Section>
      ) : null}

      {/* Lead form — mirrors Program detail's Apply section */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow brand="academy">Apply</Eyebrow>
            <h2 className="mt-4 max-w-[18ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              Start your application.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Share a few details and a HIGAET advisor will reach out within one business day with
              next steps.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
            <LeadForm division="academy" source={`course:${course.slug}`} />
          </div>
        </div>
      </Section>

      {/* FAQ — same as Program detail */}
      {course.faqs?.length ? (
        <Section className="bg-muted/30">
          <FAQ
            items={(course.faqs as readonly { question: string; answer: string }[]).map(
              (f: { question: string; answer: string }) => ({ q: f.question, a: f.answer }),
            )}
            eyebrow="FAQ"
            title="Common questions"
          />
        </Section>
      ) : null}

      {/* Related courses — same-category internal linking */}
      {related.length ? (
        <Section className="!pt-0">
          <Eyebrow brand="academy">Related courses</Eyebrow>
          <h2 className="mt-4 max-w-[22ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Continue in {category?.name ?? "the Academy"}.
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to="/academy/courses/$slug"
                params={{ slug: r.slug }}
                className="group rounded-xl bg-card p-6 ring-1 ring-border transition-colors hover:ring-academy/40"
              >
                <p className="text-sm font-semibold leading-snug text-ink group-hover:text-academy">
                  {r.title}
                </p>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {r.summary}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-academy">
                  View Course <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <CTASection
        title={`Ready to start ${course.title}?`}
        body={
          course.duration
            ? `A ${course.duration} course — ${category?.name ?? "HIGAET Academy"}.`
            : (category?.name ?? "HIGAET Academy")
        }
        primaryHref="/academy/contact"
        primaryLabel="Talk to an advisor"
        secondaryHref="/academy/courses"
        secondaryLabel="Browse all courses"
      />
    </>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div>
      <Icon className="mb-2 size-4 text-academy" aria-hidden />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
