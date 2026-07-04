import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { FAQ, faqJsonLd, type QA } from "@/components/site/FAQ";
import { HIGAET_KNOWLEDGE_GRAPH } from "@/lib/knowledge-graph";

const PATH = "/higaet-ai-platform";
const URL = `https://www.higaet.com${PATH}`;
const TITLE = "HIGAET AI Platform — RAG, Agents, and Multi-Model Orchestration";
const DESC =
  "HIGAET AI Platform powers AI tutors, advisors, and copilots across the HIGAET ecosystem with RAG, agentic workflows, multi-model orchestration, and observability.";

const FAQS: QA[] = [
  { q: "What is the HIGAET AI Platform?", a: "It is the internal AI runtime that powers HIGAET's tutors, advisors, copilots and counsellor tools across Academy, Global Education Hub and Technologies." },
  { q: "What capabilities does the platform provide?", a: "Retrieval-augmented generation (RAG), agentic workflows, multi-model orchestration, vector search, observability, guardrails, and AI evaluation." },
  { q: "Which models does the platform support?", a: "Multi-provider orchestration spanning OpenAI, Anthropic, Google Gemini, Perplexity, and open-source models, routed by cost, latency and task." },
  { q: "Where is the platform used?", a: "AI Tutor for Academy learners, AI Advisor for Global Education applicants, AI Copilot for counsellors, and bespoke AI workloads delivered by HIGAET Technologies." },
  { q: "Is the platform available to external customers?", a: "Yes, via HIGAET Technologies engagements — typically as managed RAG and agent systems integrated into client products." },
];

export const Route = createFileRoute("/higaet-ai-platform")({
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
  component: HigaetAiPlatformPage,
});

function HigaetAiPlatformPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Entity Overview"
        title="HIGAET AI Platform."
        subtitle="The internal AI runtime powering tutors, advisors, copilots and enterprise AI workloads across HIGAET."
      />
      <Section>
        <div className="prose prose-lg max-w-3xl">
          <h2>Summary</h2>
          <p>
            HIGAET AI Platform is the shared AI infrastructure of{" "}
            <Link to="/about-higaet">HIGAET</Link>. It provides RAG, agents,
            multi-model orchestration and observability to every HIGAET division.
          </p>
          <h2>Key Facts</h2>
          <ul>
            <li>Parent organization: HIGAET</li>
            <li>Capabilities: RAG, agentic workflows, vector search, multi-model routing</li>
            <li>Models: OpenAI, Anthropic, Google, Perplexity, open-source</li>
            <li>Operates: AI Tutor, AI Advisor, AI Copilot, enterprise AI workloads</li>
          </ul>
          <h2>Explore</h2>
          <ul>
            <li><Link to="/ai">AI Hub</Link></li>
            <li><Link to="/ai/prompts">Prompt library</Link></li>
            <li><Link to="/docs">Documentation</Link></li>
            <li><Link to="/higaet-technologies">Enterprise AI engagements</Link></li>
          </ul>
        </div>
      </Section>
      <Section>
        <FAQ eyebrow="FAQ" title="HIGAET AI Platform FAQs" items={FAQS} />
      </Section>
      <CTASection title="Bring HIGAET AI into your organization." body="Engage HIGAET Technologies to deploy RAG and agent systems on your data." />
    </SiteShell>
  );
}
