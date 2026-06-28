import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/technologies/contact")({
  head: () => ({
    meta: [
      { title: "Contact HIGAET Technologies" },
      { name: "description", content: "Contact HIGAET Technologies for software development, AI solutions, SaaS products, digital marketing, and enterprise product development." },
    ],
  }),
  component: TechContactPage,
});

function TechContactPage() {
  return (
    <DivisionDetailPage
      brand="tech"
      eyebrow="Technologies contact"
      title="Start a technology project with HIGAET."
      subtitle="Tell us about your software, AI, SaaS, product, or growth challenge. We’ll recommend the right delivery approach."
      overviewTitle="Project conversations start with the problem."
      overviewBody="Use this route for enterprise software, AI implementations, SaaS builds, product development, digital growth, and technical advisory enquiries."
      points={[
        { title: "Problem framing", body: "Clarify business objectives, users, workflows, constraints, and expected outcomes." },
        { title: "Scope recommendation", body: "Identify whether you need discovery, prototype, MVP, modernization, or full build." },
        { title: "Team planning", body: "Map the roles, skills, and delivery rhythm needed for the engagement." },
        { title: "Next steps", body: "Receive a practical follow-up path based on urgency, complexity, and readiness." },
      ]}
      outcomes={[
        "A clearer understanding of the project route and delivery model.",
        "Initial guidance on scope, timeline, and team structure.",
        "Identification of AI, software, product, or growth workstreams.",
        "Follow-up from the appropriate Technologies advisor.",
      ]}
      ctaTitle="Ready to discuss your technology roadmap?"
      ctaBody="Submit your enquiry and a HIGAET Technologies advisor will respond within one business day."
      primaryLabel="Send enquiry"
      secondaryHref="/technologies/case-studies"
      secondaryLabel="Case studies"
      leadDivision="tech"
      leadSource="tech_contact"
    />
  );
}