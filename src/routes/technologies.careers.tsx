import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/technologies/careers")({
  head: () => ({
    meta: [
      { title: "Careers at HIGAET Technologies" },
      { name: "description", content: "Explore technology careers with HIGAET Technologies across software engineering, AI systems, product, design, and growth." },
    ],
  }),
  component: TechCareersPage,
});

function TechCareersPage() {
  return (
    <DivisionDetailPage
      brand="tech"
      eyebrow="Careers"
      title="Build AI and software systems with HIGAET Technologies."
      subtitle="A home for engineers, product builders, designers, and growth specialists working on applied AI and enterprise software."
      overviewTitle="Technology careers connected to the wider HIGAET ecosystem."
      overviewBody="Our teams work across education, admissions, enterprise software, AI tools, and SaaS products, creating room for practical builders to grow."
      points={[
        { title: "Engineering", body: "Full-stack, platform, AI, data, integration, and quality engineering roles." },
        { title: "Product & design", body: "Product management, UX, research, prototyping, and delivery coordination." },
        { title: "AI systems", body: "Retrieval, agents, evaluations, workflow automation, and applied AI operations." },
        { title: "Growth & operations", body: "Marketing technology, analytics, customer success, and project operations." },
      ]}
      outcomes={[
        "Opportunities to work on practical AI and software products.",
        "Exposure to education, global admissions, and enterprise technology domains.",
        "A collaborative environment linking Academy talent and technology delivery.",
        "Clearer pathways for builders who value execution and learning.",
      ]}
      ctaTitle="Interested in joining HIGAET Technologies?"
      ctaBody="Share your background through our careers page or contact the team for relevant openings."
      primaryLabel="View careers"
      secondaryHref="/careers"
      secondaryLabel="Open roles"
    />
  );
}