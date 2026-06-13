import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/technologies/ai-solutions")({
  head: () => ({
    meta: [
      { title: "AI Solutions — HIGAET Technologies" },
      { name: "description", content: "Applied AI solutions including retrieval systems, workflow automation, agents, evaluations, and AI-enabled enterprise software." },
    ],
    links: [{ rel: "canonical", href: "/technologies/ai-solutions" }],
  }),
  component: AiSolutionsPage,
});

function AiSolutionsPage() {
  return (
    <DivisionDetailPage
      brand="tech"
      eyebrow="AI solutions"
      title="Applied AI systems that work inside real operations."
      subtitle="Retrieval, agents, automation, evaluations, and governed AI workflows built for enterprise constraints."
      overviewTitle="AI delivery starts with the workflow, not the model."
      overviewBody="We identify where AI can create measurable value, then design the data, evaluation, guardrail, and integration layer needed for production use."
      points={[
        { title: "Use-case discovery", body: "Prioritize opportunities by value, feasibility, risk, and implementation effort." },
        { title: "RAG & knowledge systems", body: "Build retrieval pipelines, document workflows, and grounded response systems." },
        { title: "Agents & automation", body: "Design task automation with human oversight, tool use, and escalation paths." },
        { title: "Evaluation & governance", body: "Measure quality, safety, cost, and drift so teams can trust AI outputs." },
      ]}
      outcomes={[
        "A prioritized AI roadmap for real business workflows.",
        "Working AI prototypes that can graduate into production systems.",
        "Evaluation criteria for accuracy, safety, and operational value.",
        "Integration plans for existing tools, data, and teams.",
      ]}
      ctaTitle="Find the right AI use case for your business."
      ctaBody="Talk to HIGAET Technologies about practical AI implementation and risk controls."
      primaryLabel="Discuss AI project"
      secondaryHref="/academy/corporate-training"
      secondaryLabel="Team training"
    />
  );
}