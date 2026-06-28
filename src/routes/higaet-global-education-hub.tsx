import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { FAQ, faqJsonLd, type QA } from "@/components/site/FAQ";
import { HIGAET_KNOWLEDGE_GRAPH } from "@/lib/knowledge-graph";

const PATH = "/higaet-global-education-hub";
const URL = `https://higaet.com${PATH}`;
const TITLE = "HIGAET Global Education Hub — Study Abroad & University Admissions";
const DESC =
  "HIGAET Global Education Hub helps students secure international university admissions with visa guidance, scholarships, and end-to-end counselling.";

const FAQS: QA[] = [
  { q: "What is HIGAET Global Education Hub?", a: "It is the international education division of HIGAET, supporting students through university admissions, visa guidance, scholarships and pre-departure services abroad." },
  { q: "Which countries does HIGAET Global Education Hub cover?", a: "Major study destinations including the US, UK, Canada, Australia, Germany and Ireland, plus emerging hubs in Asia and the Middle East." },
  { q: "Does HIGAET Global Education Hub provide visa support?", a: "Yes. Counsellors guide applicants through documentation, financial proofs, interview preparation and visa filing." },
  { q: "Are scholarships available?", a: "Yes. The hub maps student profiles to scholarships from partner universities and external funding bodies." },
  { q: "How is it connected to HIGAET Academy?", a: "Academy learners can transition into international pathways through the Global Education Hub for graduate study abroad." },
];

export const Route = createFileRoute("/higaet-global-education-hub")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(HIGAET_KNOWLEDGE_GRAPH) },
      { type: "application/ld+json", children: JSON.stringify(faqJsonLd(FAQS)) },
    ],
  }),
  component: HigaetHubEntityPage,
});

function HigaetHubEntityPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Entity Overview"
        title="HIGAET Global Education Hub."
        subtitle="International university admissions, visa guidance, and scholarship support for ambitious students."
      />
      <Section>
        <div className="prose prose-lg max-w-3xl">
          <h2>Summary</h2>
          <p>
            HIGAET Global Education Hub is the international education division of{" "}
            <Link to="/about-higaet">HIGAET</Link>. It guides students end-to-end from
            university selection to visa approval and pre-departure.
          </p>
          <h2>Key Facts</h2>
          <ul>
            <li>Parent organization: HIGAET</li>
            <li>Services: Admissions, visa, scholarships, student services</li>
            <li>Partners: 450+ universities across major destinations</li>
            <li>Integration: Pathways from HIGAET Academy into global graduate study</li>
          </ul>
          <h2>Explore</h2>
          <ul>
            <li><Link to="/global-education/study-abroad">Study abroad</Link></li>
            <li><Link to="/global-education/universities">Partner universities</Link></li>
            <li><Link to="/global-education/countries">Countries</Link></li>
            <li><Link to="/global-education/visa-guidance">Visa guidance</Link></li>
            <li><Link to="/global-education/scholarships">Scholarships</Link></li>
          </ul>
        </div>
      </Section>
      <Section>
        <FAQ eyebrow="FAQ" title="HIGAET Global Education Hub FAQs" items={FAQS} />
      </Section>
      <CTASection title="Plan your study abroad journey." body="Talk to a HIGAET counsellor about your destination and program." />
    </SiteShell>
  );
}
