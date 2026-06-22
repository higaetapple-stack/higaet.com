import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, GraduationCap, IndianRupee, Users, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { FAQ, faqJsonLd } from "@/components/site/FAQ";
import { LeadForm } from "@/components/site/LeadForm";
import { getProgram, CATEGORY_LABELS, type Program, type ProgramCategory } from "@/lib/academy-programs";
import { buildCourseJsonLd, buildBreadcrumbJsonLd, buildProviderJsonLd } from "@/lib/seo/course-schema";

export const Route = createFileRoute("/academy/programs/$slug")({
  loader: ({ params }): { program: Program } => {
    const program = getProgram(params.slug);
    if (!program) throw notFound();
    return { program };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Program not found — HIGAET Academy" }] };
    const { program } = loaderData;
    const title = `${program.title} — HIGAET Academy`;
    return {
      meta: [
        { title },
        { name: "description", content: program.tagline },
        { property: "og:title", content: title },
        { property: "og:description", content: program.tagline },
        { property: "og:url", content: `/academy/programs/${params.slug}` },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: `/academy/programs/${params.slug}` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd(program.faqs)) },
        { type: "application/ld+json", children: JSON.stringify(buildCourseJsonLd(program, params.slug)) },
        { type: "application/ld+json", children: JSON.stringify(buildProviderJsonLd()) },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Academy", url: "/academy" },
              { name: "Programs", url: "/academy/programs" },
              { name: program.title, url: `/academy/programs/${params.slug}` },
            ])
          ),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <Section>
      <h1 className="font-display text-3xl">Program not found</h1>
      <p className="mt-3 text-muted-foreground">
        <Link to="/academy/programs" className="text-academy underline">Browse all programs</Link>
      </p>
    </Section>
  ),
  errorComponent: ({ error }) => (
    <Section>
      <h1 className="font-display text-2xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </Section>
  ),
  component: ProgramDetail,
});

function ProgramDetail() {
  const { program } = Route.useLoaderData() as { program: Program };
  const categoryLabel = CATEGORY_LABELS[program.category as ProgramCategory];



  return (
    <>
      <PageHero
        brand="academy"
        eyebrow={`${categoryLabel} · ${program.level}`}
        title={program.title}
        subtitle={program.tagline}
      >
        <div className="grid max-w-3xl grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
          <Meta icon={Clock} label="Duration" value={program.duration} />
          <Meta icon={GraduationCap} label="Format" value={program.format} />
          <Meta icon={IndianRupee} label="Fee" value={program.feeINR} />
          <Meta icon={Users} label="Next start" value={program.startDate} />
        </div>
      </PageHero>

      {/* Curriculum */}
      <Section className="!pt-0">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow brand="academy">Curriculum</Eyebrow>
            <h2 className="mt-4 max-w-[20ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              A {program.duration.toLowerCase()} arc, term by term.
            </h2>
          </div>
          <ol className="space-y-6">
            {program.curriculum.map((term) => (
              <li key={term.term} className="rounded-xl bg-card p-6 ring-1 ring-border">
                <span className="text-[10px] font-bold uppercase tracking-widest text-academy">{term.term}</span>
                <h3 className="mt-2 font-display text-lg font-medium text-ink">{term.title}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {term.topics.map((t) => (
                    <li key={t} className="rounded-md bg-muted/60 px-2.5 py-1 text-xs text-ink">{t}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Eligibility + Fees */}
      <Section className="bg-muted/30">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-8 ring-1 ring-border">
            <Eyebrow brand="academy">Eligibility</Eyebrow>
            <h3 className="mt-3 font-display text-2xl font-medium text-ink">Who this program is for</h3>
            <ul className="mt-5 space-y-3">
              {program.eligibility.map((e) => (
                <li key={e} className="flex gap-3 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-academy" aria-hidden />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-card p-8 ring-1 ring-border">
            <Eyebrow brand="academy">Fees & financing</Eyebrow>
            <h3 className="mt-3 font-display text-2xl font-medium text-ink">Transparent pricing</h3>
            <dl className="mt-5 grid grid-cols-2 gap-y-4 text-sm">
              <dt className="text-muted-foreground">Total fee</dt>
              <dd className="text-right text-ink font-medium">{program.feeINR}</dd>
              <dt className="text-muted-foreground">EMI from</dt>
              <dd className="text-right text-ink font-medium">{program.emiFromINR}</dd>
              <dt className="text-muted-foreground">Scholarships</dt>
              <dd className="text-right text-ink font-medium">Up to 60% via HAT</dd>
            </dl>
            <Link
              to="/academy/scholarship"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-academy"
            >
              Check scholarship eligibility <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </Section>

      {/* Outcomes */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow brand="academy">Outcomes</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              What you'll be able to do.
            </h2>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {program.outcomes.map((o) => (
              <li key={o} className="flex gap-3 text-sm text-ink">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-academy" aria-hidden />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Faculty */}
      <Section className="bg-muted/30">
        <Eyebrow brand="academy">Faculty</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
          Practitioners, not lecturers.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {program.faculty.map((f) => (
            <article key={f.name} className="rounded-xl bg-card p-6 ring-1 ring-border">
              <h3 className="font-display text-lg font-medium text-ink">{f.name}</h3>
              <p className="text-xs uppercase tracking-widest text-academy">{f.role}</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.bio}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Lead form */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow brand="academy">Apply</Eyebrow>
            <h2 className="mt-4 max-w-[18ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              Start your application.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Share a few details and a HIGAET advisor will reach out within one business day with next steps.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
            <LeadForm division="academy" source={`program:${program.slug}`} />
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="bg-muted/30">
        <FAQ items={program.faqs} eyebrow="FAQ" title="Common questions" />
      </Section>

      <CTASection
        title={`Ready to join ${program.title}?`}
        body={program.startDate}
        primaryHref="/academy/contact"
        primaryLabel="Talk to an advisor"
        secondaryHref="/academy/programs"
        secondaryLabel="Compare programs"
      />
    </>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div>
      <Icon className="mb-2 size-4 text-academy" aria-hidden />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
