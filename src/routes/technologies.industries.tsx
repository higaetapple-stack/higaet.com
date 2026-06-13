import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/technologies/industries")({
  head: () => ({
    meta: [
      { title: "Industries — HIGAET Technologies" },
      { name: "description", content: "Technology and AI solutions for education, admissions, enterprise operations, SaaS, services, and digital businesses." },
    ],
    links: [{ rel: "canonical", href: "/technologies/industries" }],
  }),
  component: IndustriesPage,
});

function IndustriesPage() {
  return (
    <DivisionDetailPage
      brand="tech"
      eyebrow="Industries"
      title="AI and software solutions across education, services, and enterprise."
      subtitle="Technology delivery for sectors where workflows, data, trust, and scale matter."
      overviewTitle="Industry context changes what good technology looks like."
      overviewBody="We adapt product, software, and AI delivery to the operational realities of each sector instead of applying generic templates."
      points={[
        { title: "Education", body: "Learning platforms, admissions workflows, student support systems, and AI-assisted education tools." },
        { title: "Enterprise operations", body: "Workflow automation, dashboards, internal platforms, and knowledge systems." },
        { title: "Digital services", body: "Customer portals, booking flows, CRM-connected systems, and content operations." },
        { title: "SaaS ventures", body: "New product builds, platform foundations, and scalable subscription software." },
      ]}
      outcomes={[
        "Better technology decisions for sector-specific workflows.",
        "AI and software roadmaps grounded in operational realities.",
        "Systems that support staff, customers, students, or partners clearly.",
        "Reusable foundations for future products and integrations.",
      ]}
      ctaTitle="Apply HIGAET engineering to your industry."
      ctaBody="Tell us your sector and workflow challenge so we can recommend a focused technology plan."
      primaryLabel="Discuss industry fit"
      secondaryHref="/technologies/software-development"
      secondaryLabel="Software development"
    />
  );
}