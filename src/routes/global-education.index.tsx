import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Globe2, Plane, ScrollText, HandCoins } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { StatBand } from "@/components/site/StatBand";
import { CTASection } from "@/components/site/CTASection";
import { FeatureGrid } from "@/components/site/FeatureGrid";
import { FAQ, faqJsonLd } from "@/components/site/FAQ";

const FAQS = [
  { q: "Which countries does HIGAET Global Hub work with?", a: "We have active university partnerships in the UK, US, Canada, Australia, Ireland, Germany, and Singapore. We support applications to many more on request." },
  { q: "Do you charge counselling fees?", a: "Initial consultations are free. Full-cycle counselling is fee-based and depends on the destination and program scope. We'll quote transparently before any commitment." },
  { q: "Can you help with scholarships?", a: "Yes — our team tracks scholarships across partner institutions and external bodies, and helps you assemble competitive applications." },
  { q: "How long does a typical admissions cycle take?", a: "Plan on six to nine months from shortlisting to visa approval. Earlier is always better — many top scholarships have deadlines twelve months ahead of intake." },
];

export const Route = createFileRoute("/global-education/")({
  head: () => ({
    meta: [
      { title: "HIGAET Global Education Hub — Study Abroad & Visas" },
      { name: "description", content: "University partnerships, scholarships, and visa guidance for students applying to global institutions. End-to-end counselling from HIGAET." },
      { property: "og:title", content: "HIGAET Global Education Hub — Study Abroad & Visas" },
      { property: "og:description", content: "Study abroad, simplified — from shortlisting to visa." },
      { property: "og:url", content: "/global-education" },
    ],
    links: [{ rel: "canonical", href: "/global-education" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(faqJsonLd(FAQS)) },
    ],
  }),
  component: GlobalHome,
});

function GlobalHome() {
  return (
    <>
      <PageHero
        brand="global"
        eyebrow="HIGAET Global Education Hub"
        title="Your path to a world-class university, simplified."
        subtitle="From shortlisting to visa, HIGAET Global Hub guides ambitious students through the entire international admissions journey."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/global-education/admission-process"
            className="bg-global text-white text-sm font-medium px-4 py-2.5 rounded-md inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            See the process <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/global-education/contact"
            className="ring-1 ring-border text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors"
          >
            Free consultation
          </Link>
        </div>
      </PageHero>

      <StatBand
        stats={[
          { value: "450+", label: "Partner universities" },
          { value: "20+", label: "Destination countries" },
          { value: "94%", label: "Visa success rate" },
          { value: "$18M+", label: "Scholarships secured" },
        ]}
      />

      <Section>
        <span className="text-xs font-semibold uppercase tracking-widest text-global">Services</span>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[28ch] text-balance">
          End-to-end support, from your first question to your first day on campus.
        </h2>
        <FeatureGrid
          brand="global"
          columns={4}
          features={[
            { icon: Globe2, title: "University shortlisting", body: "Match your profile and ambitions to the right programs across our partner network." },
            { icon: ScrollText, title: "Applications & SOPs", body: "Polished applications, SOPs, and recommendation strategy — managed end to end." },
            { icon: HandCoins, title: "Scholarships", body: "Identify and apply to merit and need-based funding across institutions and bodies." },
            { icon: Plane, title: "Visa & pre-departure", body: "Document prep, mock interviews, accommodation, and pre-departure orientation." },
          ]}
        />
      </Section>

      <Section className="bg-muted/30">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-global">FAQ</span>
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 text-balance max-w-[20ch]">
              What students ask before they apply.
            </h2>
          </div>
          <FAQ items={FAQS} />
        </div>
      </Section>

      <CTASection
        title="Talk to a Global Hub counsellor."
        body="A free 30-minute consultation to map your shortlist, timelines, and scholarship options."
        primaryHref="/global-education/contact"
        primaryLabel="Book a free consultation"
        secondaryHref="/global-education/universities"
        secondaryLabel="Browse universities"
      />
    </>
  );
}
