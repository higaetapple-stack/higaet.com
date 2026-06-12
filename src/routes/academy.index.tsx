import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Users2, Award, Briefcase } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { StatBand } from "@/components/site/StatBand";
import { CTASection } from "@/components/site/CTASection";
import { FeatureGrid } from "@/components/site/FeatureGrid";
import { FAQ, faqJsonLd } from "@/components/site/FAQ";

const FAQS = [
  { q: "Are HIGAET Academy programs recognised by employers?", a: "Yes. Our curricula are co-developed with hiring partners and aligned to industry role profiles. Graduates receive a HIGAET certificate plus a verified outcomes record." },
  { q: "Do you offer placement assistance?", a: "Yes — every Career Track program includes structured placement support: interview prep, employer introductions, and a dedicated placement counsellor through your job search." },
  { q: "Can I take Academy programs online?", a: "Most flagship programs are available both online (live cohorts) and on-campus. Some intensive bootcamps are on-campus only." },
  { q: "How are programs structured?", a: "Programs combine live instruction, recorded modules, hands-on labs, mentor reviews, and an enterprise capstone graded by industry practitioners." },
];

export const Route = createFileRoute("/academy/")({
  head: () => ({
    meta: [
      { title: "HIGAET Academy — AI engineering courses with placement support" },
      { name: "description", content: "Industry-aligned Generative AI engineering programs with online and on-campus formats, certifications, and placement support." },
      { property: "og:title", content: "HIGAET Academy" },
      { property: "og:description", content: "Industry-aligned AI engineering programs with placement support." },
      { property: "og:url", content: "/academy" },
    ],
    links: [{ rel: "canonical", href: "/academy" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(faqJsonLd(FAQS)) },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "HIGAET Academy",
          url: "/academy",
          parentOrganization: { "@type": "Organization", name: "HIGAET" },
        }),
      },
    ],
  }),
  component: AcademyHome,
});

function AcademyHome() {
  return (
    <>
      <PageHero
        brand="academy"
        eyebrow="HIGAET Academy"
        title="Engineering the next generation of AI talent."
        subtitle="Industry-aligned Gen AI programs taught by working engineers. Online and on-campus, with placement support that's measured in outcomes."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/academy/online-courses"
            className="bg-academy text-white text-sm font-medium px-4 py-2.5 rounded-md inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            Explore programs <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/academy/contact"
            className="ring-1 ring-border text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors"
          >
            Talk to admissions
          </Link>
        </div>
      </PageHero>

      <StatBand
        stats={[
          { value: "12k+", label: "Learners trained" },
          { value: "300+", label: "Hiring partners" },
          { value: "92%", label: "Placement within 6 mo" },
          { value: "4.8/5", label: "Average rating" },
        ]}
      />

      <Section>
        <span className="text-xs font-semibold uppercase tracking-widest text-academy">What we offer</span>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[28ch] text-balance">
          Programs designed around what AI engineers actually do.
        </h2>
        <FeatureGrid
          brand="academy"
          columns={4}
          features={[
            { icon: GraduationCap, title: "Online cohorts", body: "Live instruction, project work, and mentor reviews on a structured schedule." },
            { icon: Users2, title: "On-campus intensives", body: "Immersive bootcamps with hands-on lab time and employer exposure." },
            { icon: Award, title: "Industry certifications", body: "Verified credentials aligned to real role profiles, not generic syllabi." },
            { icon: Briefcase, title: "Placement support", body: "Structured prep, employer intros, and a dedicated placement counsellor." },
          ]}
        />
      </Section>

      <Section className="bg-muted/30">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-academy">FAQ</span>
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 text-balance max-w-[20ch]">
              Common questions, answered plainly.
            </h2>
          </div>
          <FAQ items={FAQS} />
        </div>
      </Section>

      <CTASection
        title="Start your AI engineering career with HIGAET Academy."
        body="Book a free consultation with our admissions team to find the right program."
        primaryHref="/academy/contact"
        primaryLabel="Talk to admissions"
        secondaryHref="/academy/online-courses"
        secondaryLabel="See online courses"
      />
    </>
  );
}
