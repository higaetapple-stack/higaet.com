import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/academy/placements")({
  head: () => ({
    meta: [
      { title: "Placement Support — HIGAET Academy" },
      { name: "description", content: "Structured placement preparation, employer introductions, portfolio support, and interview coaching for HIGAET Academy learners." },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/academy/placements" }],
  }),
  component: PlacementsPage,
});

function PlacementsPage() {
  return (
    <DivisionDetailPage
      brand="academy"
      eyebrow="Placements"
      title="Placement support shaped around employer expectations."
      subtitle="Career preparation, portfolio positioning, interview readiness, and hiring partner introductions for eligible program graduates."
      overviewTitle="A career pathway built into the learning journey."
      overviewBody="The placement process starts before completion, with role mapping, evidence-building, interview preparation, and targeted employer conversations."
      points={[
        { title: "Role mapping", body: "Identify realistic target roles based on strengths, projects, and market demand." },
        { title: "Portfolio preparation", body: "Shape capstones, GitHub profiles, resumes, and case narratives for hiring teams." },
        { title: "Interview coaching", body: "Mock interviews, communication practice, and technical discussion preparation." },
        { title: "Employer access", body: "Introductions to hiring partners where learner readiness and role fit align." },
      ]}
      outcomes={[
        "A job-search plan with target roles and readiness milestones.",
        "Resume, portfolio, and project story prepared for recruiter review.",
        "Improved confidence in technical and HR interview rounds.",
        "Ongoing placement counselling through the agreed support window.",
      ]}
      ctaTitle="Prepare for your next AI role."
      ctaBody="Connect with the Academy team to understand placement eligibility and support tracks."
      primaryLabel="Discuss placement"
      secondaryHref="/academy/success-stories"
      secondaryLabel="Success stories"
    />
  );
}