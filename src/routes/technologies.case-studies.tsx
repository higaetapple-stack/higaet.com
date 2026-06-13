import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/technologies/case-studies")({
  head: () => ({
    meta: [
      { title: "Technology Case Studies — HIGAET Technologies" },
      { name: "description", content: "Explore HIGAET Technologies case study themes across software, AI, SaaS, digital growth, and product engineering." },
    ],
    links: [{ rel: "canonical", href: "/technologies/case-studies" }],
  }),
  component: CaseStudiesPage,
});

function CaseStudiesPage() {
  return (
    <DivisionDetailPage
      brand="tech"
      eyebrow="Case studies"
      title="Technology outcomes documented through real delivery patterns."
      subtitle="A developing case study library covering applied AI, SaaS products, custom software, and growth systems."
      overviewTitle="Case studies should show decisions, trade-offs, and results."
      overviewBody="HIGAET Technologies documents how projects move from problem definition to architecture, delivery, adoption, and measurable improvement."
      points={[
        { title: "Problem context", body: "Define the operational, product, or market constraint the work addressed." },
        { title: "Architecture choices", body: "Explain technical decisions, integrations, and delivery trade-offs." },
        { title: "Implementation", body: "Show how teams moved from roadmap to working release." },
        { title: "Measured value", body: "Connect the project to adoption, efficiency, revenue, or customer experience outcomes." },
      ]}
      outcomes={[
        "A clearer view of HIGAET Technologies delivery standards.",
        "Examples of how AI and software projects are scoped and shipped.",
        "Reusable learning for future enterprise technology decisions.",
        "Evidence-based conversations before a new engagement begins.",
      ]}
      ctaTitle="Discuss a project like these."
      ctaBody="Tell us about the problem you want to solve and we’ll recommend the right delivery path."
      primaryLabel="Start a project"
      secondaryHref="/technologies/ai-solutions"
      secondaryLabel="AI solutions"
    />
  );
}