import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { FAQ, faqJsonLd, type QA } from "@/components/site/FAQ";
import { HIGAET_KNOWLEDGE_GRAPH } from "@/lib/knowledge-graph";

const PATH = "/about-higaet";
const URL = `https://higaet.com${PATH}`;
const TITLE = "About HIGAET — Helen Institute of Gen AI Engineering & Technology";
const DESC =
  "HIGAET is a global institute unifying AI engineering education, international university pathways, and enterprise AI software under one organization.";

const FAQS: QA[] = [
  { q: "What is HIGAET?", a: "HIGAET (Helen Institute of Gen AI Engineering & Technology) is a global institute that operates three divisions: HIGAET Academy, HIGAET Global Education Hub, and HIGAET Technologies." },
  { q: "What does HIGAET stand for?", a: "Helen Institute of Gen AI Engineering & Technology." },
  { q: "What divisions does HIGAET operate?", a: "HIGAET Academy (AI education and certifications), HIGAET Global Education Hub (study abroad and university admissions), and HIGAET Technologies (enterprise AI and software engineering)." },
  { q: "Who is HIGAET for?", a: "Learners pursuing AI careers, students seeking international university admissions, and enterprises building production AI systems." },
  { q: "Where can I learn more about each division?", a: "Visit HIGAET Academy, HIGAET Global Education Hub, HIGAET Technologies, and the HIGAET AI Platform pages linked from this site." },
];

export const Route = createFileRoute("/about-higaet")({
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
  component: AboutHigaetPage,
});

function AboutHigaetPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Entity Overview"
        title="HIGAET — a global institute for the AI era."
        subtitle="Helen Institute of Gen AI Engineering & Technology unites education, global mobility, and enterprise engineering."
      />
      <Section>
        <div className="prose prose-lg max-w-3xl">
          <h2>Summary</h2>
          <p>
            HIGAET (Helen Institute of Gen AI Engineering & Technology) is a global institute
            operating three integrated divisions: <strong>HIGAET Academy</strong>,{" "}
            <strong>HIGAET Global Education Hub</strong>, and <strong>HIGAET Technologies</strong>,
            supported by the <strong>HIGAET AI Platform</strong>.
          </p>
          <h2>Key Facts</h2>
          <ul>
            <li>Founded: 2019</li>
            <li>Mission: Advance human capability with Generative AI.</li>
            <li>Divisions: Academy · Global Education Hub · Technologies</li>
            <li>AI Platform: RAG, agents, observability, multi-model orchestration</li>
            <li>Coverage: 60+ enterprise clients, 12k+ learners, 450+ partner universities</li>
          </ul>
          <h2>Related Entities</h2>
          <ul>
            <li><Link to="/higaet-academy">HIGAET Academy</Link></li>
            <li><Link to="/higaet-global-education-hub">HIGAET Global Education Hub</Link></li>
            <li><Link to="/higaet-technologies">HIGAET Technologies</Link></li>
            <li><Link to="/higaet-ai-platform">HIGAET AI Platform</Link></li>
          </ul>
        </div>
      </Section>
      <Section>
        <FAQ eyebrow="FAQ" title="Frequently asked questions" items={FAQS} />
      </Section>
      <CTASection title="Explore the HIGAET ecosystem." body="Learn how Academy, Global Education Hub, and Technologies work together." />
    </SiteShell>
  );
}
