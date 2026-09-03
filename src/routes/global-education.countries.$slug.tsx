import { createFileRoute, Link } from "@tanstack/react-router";
import { getCountryData } from "@/lib/countries-data";
import { ArrowRight, BookOpen, Calendar, Users } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { buildCountryJsonLd, buildCountryBreadcrumbJsonLd, buildCountryFaqJsonLd } from "@/components/site/CountryJsonLd";



export const Route = createFileRoute("/global-education/countries/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    const country = getCountryData(slug);
    if (!country) {
      return {
        meta: [{ title: "Country not found — HIGAET Global Education Hub" }],
      };
    }
    const url = "https://www.higaet.com/global-education/countries/" + slug;
    const scripts = [];
    const countryJsonLd = buildCountryJsonLd(slug);
    if (countryJsonLd) scripts.push({ type: "application/ld+json", children: JSON.stringify(countryJsonLd) });
    const breadcrumbJsonLd = buildCountryBreadcrumbJsonLd(slug);
    if (breadcrumbJsonLd) scripts.push({ type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd) });
    const faqJsonLd = buildCountryFaqJsonLd(slug);
    if (faqJsonLd) scripts.push({ type: "application/ld+json", children: JSON.stringify(faqJsonLd) });
    return {
      meta: [
        { title: "Study in " + country.name + " — HIGAET Global Education Hub" },
        { name: "description", content: country.summary },
        { property: "og:title", content: "Study in " + country.name },
        { property: "og:description", content: country.summary },
        { property: "og:url", content: "https://www.higaet.com/global-education/countries/" + slug },
        { property: "og:image", content: "https://www.higaet.com/og-higaet.png" },
        { property: "og:type", content: "website" },
      ],
      scripts,
    };
  },
  component: CountryDetailPage,
});

function CountryDetailPage() {
  const { slug } = Route.useParams();
  const country = getCountryData(slug);

  if (!country) {
    return (
      <SiteShell>
        <PageHero eyebrow="Countries" title="Destination not found" subtitle="The study destination you are looking for is not available." />
        <Section className="!pt-0">
          <p className="text-muted-foreground">The study destination you are looking for is not available.</p>
          <Link to="/global-education/countries" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-tech">
            Back to Countries
          </Link>
        </Section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="px-6 pt-8">
        <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-ink transition-colors">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/global-education" className="hover:text-ink transition-colors">Global Education Hub</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/global-education/countries" className="hover:text-ink transition-colors">Countries</Link></li>
            <li aria-hidden>/</li>
            <li><span className="text-ink font-medium">{country.name}</span></li>
          </ol>
        </nav>
      </div>

      <PageHero
        brand="global"
        eyebrow="Study Destination"
        title={"Study in " + country.name}
        subtitle={country.flag + " " + country.summary}
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="text-3xl" aria-hidden>{country.flag}</span>
          <span className="inline-flex items-center gap-1.5"><BookOpen className="size-3.5" /> {country.primaryLanguage}</span>
          <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /> Top {country.topUniversities.length} universities</span>
        </div>
      </PageHero>

      <Section className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_0.3fr]">
          <div className="space-y-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed">{country.summary}</p>

              <h2 className="font-display text-2xl font-medium text-ink mt-10 mb-4">Why Choose " + country.name + "?</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>World-class universities with global recognition</li>
                <li>Post-study work opportunities: " + country.postStudyWork + "</li>
                <li>Affordable education" + (country.avgTuitionUsd === 0 ? " (no tuition fees at public universities)" : " with average tuition of $" + String(country.avgTuitionUsd).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "/year") + "</li>
                <li>Generous post-study work rights: " + country.workRights + "</li>
                <li>Diverse, multicultural student community</li>
                <li>Pathway to permanent residency for skilled graduates</li>
              </ul>

              <h2 className="font-display text-2xl font-medium text-ink mt-10 mb-4">Top Universities</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                {country.topUniversities.map((u, i) => <li key={i}>{u}</li>)}
              </ul>

              <h2 className="font-display text-2xl font-medium text-ink mt-10 mb-4">Visa & Immigration</h2>
              <h3 className="font-medium text-ink mt-6 mb-2">Student Visa Types</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                {country.visaTypes.map((v, i) => <li key={i}>{v}</li>)}
              </ul>

              <h3 className="font-medium text-ink mt-6 mb-2">Work Rights</h3>
              <p className="text-muted-foreground mb-4">{country.workRights}</p>

              <h3 className="font-medium text-ink mt-6 mb-2">Post-Study Work</h3>
              <p className="text-muted-foreground mb-4">{country.postStudyWork}</p>

              <h3 className="font-medium text-ink mt-6 mb-2">Visa Application Process</h3>
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                {country.visaProcess.map((step, i) => <li key={i}>{step}</li>)}
              </ol>

              <h2 className="font-display text-2xl font-medium text-ink mt-10 mb-4">Cost of Living & Tuition</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm text-muted-foreground border-t border-border pt-4">
                <dt className="text-ink/60">Avg Annual Tuition</dt><dd className="text-ink">{country.avgTuitionUsd === 0 ? "No tuition fees (public universities)" : "$" + String(country.avgTuitionUsd).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "/year"}</dd>
                <dt className="text-ink/60">Estimated Living Costs</dt><dd className="text-ink">$" + String(country.costOfLivingUsd).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "/year</dd>
                <dt className="text-ink/60">Primary Language</dt><dd className="text-ink">{country.primaryLanguage}</dd>
                <dt className="text-ink/60">Popular Intakes</dt><dd className="text-ink">{country.popularIntakes.join(", ")}</dd>
              </dl>

              <h2 className="font-display text-2xl font-medium text-ink mt-10 mb-4">Scholarships & Funding</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                {country.scholarships.map((s, i) => <li key={i}>{s}</li>)}
              </ul>

              <h2 className="font-display text-2xl font-medium text-ink mt-10 mb-4">Popular Intakes</h2>
              <div className="flex flex-wrap gap-2">
                {country.popularIntakes.map((i, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-global/10 text-global">
                    <Calendar className="size-3" /> {i}
                  </span>
                ))}
              </div>
            </div>
          </div>
          </div>

          <aside className="lg:sticky lg:top-24 space-y-6">
            <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Quick Facts</p>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Avg Tuition</dt><dd className="text-ink">{country.avgTuitionUsd === 0 ? "No tuition fees" : "$" + String(country.avgTuitionUsd).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "/yr"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Living Costs</dt><dd className="text-ink">$" + String(country.costOfLivingUsd).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "/yr</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Post-Study Work</dt><dd className="text-ink">{country.postStudyWork}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Language</dt><dd className="text-ink">{country.primaryLanguage}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Intakes</dt><dd className="text-ink">{country.popularIntakes.join(", ")}</dd></div>
              </dl>
            </div>

            <div className="rounded-2xl bg-global/5 p-6 ring-1 ring-global/20">
              <h3 className="font-display text-base font-medium text-ink mb-3">Plan your study in " + country.name + "</h3>
              <p className="text-sm text-muted-foreground mb-4">Our counsellors help you shortlist universities, prepare applications, and navigate visa requirements.</p>
              <Link to="/global-education/contact" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-global">
                Get free counselling <ArrowRight className="size-3.5" />
              </Link>
            </div>
        </aside>
      </Section>

      <CTASection
        title={`Ready to start your journey to ${country.name}?`}
        body="Our counsellors provide end-to-end guidance — from university selection to visa approval."
        primaryHref="/global-education/contact"
        primaryLabel="Get free counselling"
        secondaryHref="/global-education/countries"
        secondaryLabel="Compare all countries"
      />
    </SiteShell>
  );
}
