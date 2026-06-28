import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { FAQ, faqJsonLd, type QA } from "@/components/site/FAQ";
import { HIGAET_KNOWLEDGE_GRAPH } from "@/lib/knowledge-graph";

const PATH = "/higaet-academy";
const URL = `https://higaet.com${PATH}`;
const TITLE = "HIGAET Academy — AI Engineering Education & Certifications";
const DESC =
  "HIGAET Academy delivers AI engineering programs, certifications, learning paths, internships, and placements taught by practicing engineers.";

const FAQS: QA[] = [
  { q: "What is HIGAET Academy?", a: "HIGAET Academy is the education division of HIGAET, offering AI engineering programs, certifications, learning paths, internships, and placements." },
  { q: "What programs does HIGAET Academy offer?", a: "Generative AI engineering, machine learning, RAG and agentic AI, MLOps, computer vision, and NLP programs, plus corporate training." },
  { q: "Are HIGAET Academy programs online or offline?", a: "Both. Programs are offered as online courses, offline cohorts at HIGAET campuses, and blended corporate training." },
  { q: "Does HIGAET Academy offer placements?", a: "Yes. Placements and internships connect learners with HIGAET Technologies clients and 60+ enterprise hiring partners." },
  { q: "Are scholarships available?", a: "Yes. Need- and merit-based scholarships are offered. See /academy/scholarship for current programs." },
];

export const Route = createFileRoute("/higaet-academy")({
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
  component: HigaetAcademyEntityPage,
});

function HigaetAcademyEntityPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Entity Overview"
        title="HIGAET Academy."
        subtitle="The AI engineering education division of HIGAET — certifications, cohorts, internships, placements."
      />
      <Section>
        <div className="prose prose-lg max-w-3xl">
          <h2>Summary</h2>
          <p>
            HIGAET Academy is the education division of{" "}
            <Link to="/about-higaet">HIGAET</Link>. It trains the next generation of AI engineers
            through certifications, learning paths, internships and placements.
          </p>
          <h2>Key Facts</h2>
          <ul>
            <li>Parent organization: HIGAET</li>
            <li>Focus: Generative AI, ML, RAG, agentic AI, MLOps, CV, NLP</li>
            <li>Delivery: Online, offline (campuses), corporate cohorts</li>
            <li>Outcomes: Placements with HIGAET Technologies and partner enterprises</li>
          </ul>
          <h2>Explore</h2>
          <ul>
            <li><Link to="/academy/programs">Programs catalog</Link></li>
            <li><Link to="/academy/certifications">Certifications</Link></li>
            <li><Link to="/academy/learning-paths">Learning paths</Link></li>
            <li><Link to="/academy/placements">Placements</Link></li>
            <li><Link to="/academy/scholarship">Scholarships</Link></li>
          </ul>
        </div>
      </Section>
      <Section>
        <FAQ eyebrow="FAQ" title="HIGAET Academy FAQs" items={FAQS} />
      </Section>
      <CTASection title="Start your AI engineering journey." body="Browse the program catalog and find the right path." />
    </SiteShell>
  );
}
