import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { LeadForm } from "@/components/site/LeadForm";
import type { LeadDivision } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Brand = "academy" | "global" | "tech";

type DetailBlock = {
  title: string;
  body: string;
};

type DivisionDetailPageProps = {
  brand: Brand;
  eyebrow: string;
  title: string;
  subtitle: string;
  overviewTitle: string;
  overviewBody: string;
  points: DetailBlock[];
  outcomes: string[];
  ctaTitle: string;
  ctaBody: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  leadDivision?: LeadDivision;
  leadSource?: string;
  contactEmail?: string;
  contactEmailLabel?: string;
};

const accentClasses: Record<Brand, string> = {
  academy: "text-academy bg-academy/10",
  global: "text-global bg-global/10",
  tech: "text-tech bg-tech/10",
};

const contactRoutes: Record<Brand, string> = {
  academy: "/academy/contact",
  global: "/global-education/contact",
  tech: "/technologies/contact",
};

export function DivisionDetailPage({
  brand,
  eyebrow,
  title,
  subtitle,
  overviewTitle,
  overviewBody,
  points,
  outcomes,
  ctaTitle,
  ctaBody,
  primaryLabel = "Start enquiry",
  secondaryHref,
  secondaryLabel,
  leadDivision,
  leadSource,
  contactEmail,
  contactEmailLabel = "Email us directly",
}: DivisionDetailPageProps) {
  return (
    <>
      <PageHero brand={brand} eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <Section className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
          <div>
            <Eyebrow brand={brand}>Overview</Eyebrow>
            <h2 className="mt-4 max-w-[18ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              {overviewTitle}
            </h2>
            <p className="mt-5 max-w-[48ch] text-muted-foreground leading-relaxed text-pretty">
              {overviewBody}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {points.map((point) => (
              <article key={point.title} className="rounded-xl bg-card p-6 ring-1 ring-border">
                <div
                  className={cn(
                    "mb-5 flex size-10 items-center justify-center rounded-lg",
                    accentClasses[brand],
                  )}
                >
                  <CheckCircle2 className="size-5" aria-hidden />
                </div>
                <h3 className="font-display text-lg font-medium text-ink">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-muted/30">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow brand={brand}>Outcomes</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              Built for measurable progress.
            </h2>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {outcomes.map((outcome) => (
              <li key={outcome} className="flex gap-3 text-sm leading-relaxed text-ink">
                <CheckCircle2
                  className={cn("mt-0.5 size-4 shrink-0", accentClasses[brand].split(" ")[0])}
                  aria-hidden
                />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {leadDivision && leadSource ? (
        <Section>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Eyebrow brand={brand}>Contact</Eyebrow>
              <h2 className="mt-4 max-w-[18ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                Speak with the right HIGAET advisor.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Share your goals and our team will respond with the next practical step.
              </p>
              {contactEmail && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {contactEmailLabel}:{" "}
                  <a href={"mailto:" + contactEmail} className="font-medium text-ink underline">
                    {contactEmail}
                  </a>
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
              <LeadForm division={leadDivision} source={leadSource} />
            </div>
          </div>
        </Section>
      ) : null}

      <CTASection
        title={ctaTitle}
        body={ctaBody}
        primaryHref={contactRoutes[brand]}
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
      />
    </>
  );
}
