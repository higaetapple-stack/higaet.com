import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/technologies/software-development")({
  head: () => ({
    meta: [
      { title: "Software Development — HIGAET Technologies" },
      { name: "description", content: "Custom software development for web, mobile, platforms, APIs, and enterprise systems from HIGAET Technologies." },
    ],
    links: [{ rel: "canonical", href: "/technologies/software-development" }],
  }),
  component: SoftwareDevelopmentPage,
});

function SoftwareDevelopmentPage() {
  return (
    <DivisionDetailPage
      brand="tech"
      eyebrow="Software development"
      title="Custom software engineered for scale and maintainability."
      subtitle="Web, mobile, platform, and API engineering for organizations that need durable systems, not disposable builds."
      overviewTitle="Engineering discipline from discovery to delivery."
      overviewBody="HIGAET Technologies builds software around clear requirements, architecture, delivery cadence, quality controls, and long-term operability."
      points={[
        { title: "Product discovery", body: "Translate business needs into scope, workflows, architecture, and milestones." },
        { title: "Full-stack delivery", body: "Build interfaces, APIs, databases, integrations, and deployment pipelines." },
        { title: "Quality controls", body: "Apply review, testing, observability, and documentation practices." },
        { title: "Modernization", body: "Improve legacy systems, migrate platforms, and reduce technical debt." },
      ]}
      outcomes={[
        "A product roadmap connected to technical architecture.",
        "Production-ready software with maintainable code foundations.",
        "Clear delivery milestones and stakeholder visibility.",
        "A practical path for future scaling and integrations.",
      ]}
      ctaTitle="Build your next software platform with HIGAET."
      ctaBody="Tell us what you need to ship and we’ll recommend a team, scope, and delivery path."
      primaryLabel="Start a project"
      secondaryHref="/technologies/case-studies"
      secondaryLabel="Case studies"
    />
  );
}