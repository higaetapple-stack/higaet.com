import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { FAQ, faqJsonLd, type QA } from "@/components/site/FAQ";
import { HIGAET_KNOWLEDGE_GRAPH } from "@/lib/knowledge-graph";

const PATH = "/higaet-technologies";
const URL = `https://higaet.com${PATH}`;
const TITLE = "HIGAET Technologies — Enterprise AI & Software Engineering";
const DESC =
  "HIGAET Technologies delivers enterprise AI solutions, custom software, cloud, data engineering, and digital transformation services for global clients.";

const FAQS: QA[] = [
  { q: "What is HIGAET Technologies?", a: "HIGAET Technologies is the enterprise engineering division of HIGAET. It builds AI products, custom software, cloud platforms, and data systems for global clients." },
  { q: "What services does HIGAET Technologies offer?", a: "Custom software, generative AI, machine learning, cloud and DevOps, data engineering, BI, API and system integration, and digital transformation." },
  { q: "Which industries does HIGAET Technologies serve?", a: "Fintech, banking, healthcare, education, e-commerce, manufacturing, logistics, retail, real estate, hospitality, and government." },
  { q: "What engagement models are available?", a: "Fixed-price projects, time and materials, dedicated development teams, staff augmentation, offshore development centers, and build-operate-transfer." },
  { q: "How is HIGAET Technologies connected to HIGAET Academy?", a: "Technologies hires from Academy talent pipelines and runs joint corporate training programs with enterprise clients." },
];

export const Route = createFileRoute("/higaet-technologies")({
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
  component: HigaetTechEntityPage,
});

function HigaetTechEntityPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Entity Overview"
        title="HIGAET Technologies."
        subtitle="Enterprise AI solutions, custom software, cloud, and data engineering for organizations scaling their digital core."
      />
      <Section>
        <div className="prose prose-lg max-w-3xl">
          <h2>Summary</h2>
          <p>
            HIGAET Technologies is the enterprise engineering division of{" "}
            <Link to="/about-higaet">HIGAET</Link>. It designs, builds and operates AI and
            software systems for organizations worldwide.
          </p>
          <h2>Key Facts</h2>
          <ul>
            <li>Parent organization: HIGAET</li>
            <li>Services: Custom software, GenAI, ML, cloud, DevOps, data, BI, APIs</li>
            <li>Industries: Fintech, healthcare, education, e-commerce, banking, manufacturing</li>
            <li>Models: Fixed-price, T&amp;M, dedicated teams, staff augmentation, BOT</li>
          </ul>
          <h2>Explore</h2>
          <ul>
            <li><Link to="/technologies/ai-solutions">AI solutions</Link></li>
            <li><Link to="/technologies/custom-software-development">Custom software</Link></li>
            <li><Link to="/technologies/cloud-solutions">Cloud</Link></li>
            <li><Link to="/technologies/data-engineering">Data engineering</Link></li>
            <li><Link to="/technologies/engagement">Engagement models</Link></li>
          </ul>
        </div>
      </Section>
      <Section>
        <FAQ eyebrow="FAQ" title="HIGAET Technologies FAQs" items={FAQS} />
      </Section>
      <CTASection title="Build with HIGAET Technologies." body="Tell us about your AI or software initiative — we'll respond within one business day." />
    </SiteShell>
  );
}
