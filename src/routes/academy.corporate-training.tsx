import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/academy/corporate-training")({
  head: () => ({
    meta: [
      { title: "Corporate AI Training — HIGAET Academy" },
      { name: "description", content: "Enterprise AI upskilling programs for teams, including GenAI adoption, workflow automation, and applied engineering workshops." },
    ],
    links: [{ rel: "canonical", href: "/academy/corporate-training" }],
  }),
  component: CorporateTrainingPage,
});

function CorporateTrainingPage() {
  return (
    <DivisionDetailPage
      brand="academy"
      eyebrow="Corporate training"
      title="AI upskilling programs for teams and enterprises."
      subtitle="Custom workshops and structured learning tracks that help teams adopt Generative AI safely, practically, and measurably."
      overviewTitle="Training shaped around your workflows."
      overviewBody="We align curriculum to business functions, use cases, risk controls, and the practical tools your team needs to adopt AI with confidence."
      points={[
        { title: "Needs assessment", body: "Map team roles, processes, and automation opportunities before designing the program." },
        { title: "Custom workshops", body: "Role-specific sessions for leadership, operations, marketing, product, and engineering teams." },
        { title: "Governed adoption", body: "Cover responsible AI, data handling, evaluation, and workflow controls." },
        { title: "Measured outcomes", body: "Track participation, skill growth, and practical use-case delivery." },
      ]}
      outcomes={[
        "Shared AI vocabulary across business and technical teams.",
        "Prioritized internal AI use cases and implementation roadmap.",
        "Improved productivity through practical workflow adoption.",
        "Training evidence for leadership and HR development plans.",
      ]}
      ctaTitle="Plan AI training for your organization."
      ctaBody="Tell us your team size, business function, and AI adoption goal."
      primaryLabel="Request training plan"
      secondaryHref="/technologies/ai-solutions"
      secondaryLabel="AI solutions"
    />
  );
}