import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { CheckCircle2, MapPin, GraduationCap, Trophy } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { LeadForm } from "@/components/site/LeadForm";
import { getCampus, type Campus } from "@/lib/academy-programs";

export const Route = createFileRoute("/academy/campuses/$slug")({
  loader: ({ params }): { campus: Campus } => {
    const campus = getCampus(params.slug);
    if (!campus) throw notFound();
    return { campus };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Campus not found — HIGAET" }] };
    const { campus } = loaderData;
    const title = `${campus.name} — HIGAET Academy`;
    return {
      meta: [
        { title },
        { name: "description", content: `${campus.degree} at ${campus.name}, ${campus.city}.` },
        { property: "og:title", content: title },
        { property: "og:description", content: campus.degree },
        { property: "og:url", content: `/academy/campuses/${params.slug}` },
      ],
    };
  },
  notFoundComponent: () => (
    <Section>
      <h1 className="font-display text-3xl">Campus not found</h1>
      <Link to="/academy/campuses" className="mt-3 inline-block text-academy underline">All campuses</Link>
    </Section>
  ),
  errorComponent: ({ error }) => (
    <Section><p className="text-sm text-muted-foreground">{error.message}</p></Section>
  ),
  component: CampusDetail,
});

function CampusDetail() {
  const { campus } = Route.useLoaderData() as { campus: Campus };

  return (
    <>
      <PageHero
        brand="academy"
        eyebrow={campus.partnerType}
        title={campus.name}
        subtitle={campus.degree}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-academy" /> {campus.city}</span>
          <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-4 text-academy" /> {campus.durationYears} year</span>
          <span className="inline-flex items-center gap-1.5"><Trophy className="size-4 text-academy" /> {campus.scholarship}</span>
        </div>
      </PageHero>

      <Section className="!pt-0">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-8 ring-1 ring-border">
            <Eyebrow brand="academy">Eligibility</Eyebrow>
            <h3 className="mt-3 font-display text-2xl font-medium text-ink">Who can apply</h3>
            <ul className="mt-5 space-y-3">
              {campus.eligibility.map((e) => (
                <li key={e} className="flex gap-3 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-academy" aria-hidden />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-card p-8 ring-1 ring-border">
            <Eyebrow brand="academy">Highlights</Eyebrow>
            <h3 className="mt-3 font-display text-2xl font-medium text-ink">Why this campus</h3>
            <ul className="mt-5 space-y-3">
              {campus.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-academy" aria-hidden />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="bg-muted/30">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow brand="academy">Apply</Eyebrow>
            <h2 className="mt-4 max-w-[20ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              Request the campus brochure.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Share your contact and we'll send the full brochure, fee schedule, and a campus-visit invite.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
            <LeadForm division="academy" source={`campus:${campus.slug}`} />
          </div>
        </div>
      </Section>

      <CTASection
        title="Earn a scholarship via the HAT."
        body="The HIGAET Aptitude Test is the primary route to campus scholarships of up to 100%."
        primaryHref="/academy/scholarship"
        primaryLabel="Register for the HAT"
        secondaryHref="/academy/campuses"
        secondaryLabel="All campuses"
      />
    </>
  );
}
