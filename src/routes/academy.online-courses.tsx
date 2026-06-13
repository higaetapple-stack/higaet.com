import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/academy/online-courses")({
  head: () => ({
    meta: [
      { title: "Online AI Courses — HIGAET Academy" },
      { name: "description", content: "Live online Generative AI and software engineering courses with mentor reviews, applied labs, and career support." },
    ],
    links: [{ rel: "canonical", href: "/academy/online-courses" }],
  }),
  component: OnlineCoursesPage,
});

function OnlineCoursesPage() {
  return (
    <DivisionDetailPage
      brand="academy"
      eyebrow="Online courses"
      title="Live AI engineering cohorts for serious learners."
      subtitle="Structured online programs combining live instruction, labs, reviews, and career guidance for learners building production-ready AI skills."
      overviewTitle="Learn with pace, accountability, and expert review."
      overviewBody="Each cohort is designed around weekly milestones, practical assignments, and instructor feedback so learners build visible proof of capability."
      points={[
        { title: "Live cohort classes", body: "Interactive sessions with instructors, peer discussion, and recorded access for revision." },
        { title: "Applied AI labs", body: "Hands-on work across prompts, retrieval systems, agents, evaluations, and deployment patterns." },
        { title: "Mentor reviews", body: "Regular code, project, and portfolio reviews from working practitioners." },
        { title: "Career readiness", body: "Interview preparation, portfolio positioning, and employer-aligned project outcomes." },
      ]}
      outcomes={[
        "A structured project portfolio aligned to current AI engineering roles.",
        "Verified completion record for employer conversations.",
        "Practical fluency in building and evaluating AI-enabled software.",
        "Clear pathway into certifications, internships, or placement support.",
      ]}
      ctaTitle="Choose the right online AI program."
      ctaBody="Talk to admissions about your background, available schedule, and target role."
      primaryLabel="Talk to admissions"
      secondaryHref="/academy/certifications"
      secondaryLabel="View certifications"
    />
  );
}