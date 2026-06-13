import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/global-education/scholarships")({
  head: () => ({
    meta: [
      { title: "Study Abroad Scholarships — HIGAET Global Education Hub" },
      { name: "description", content: "Scholarship discovery and application support for international students applying to universities abroad." },
    ],
    links: [{ rel: "canonical", href: "/global-education/scholarships" }],
  }),
  component: ScholarshipsPage,
});

function ScholarshipsPage() {
  return (
    <DivisionDetailPage
      brand="global"
      eyebrow="Scholarships"
      title="Scholarship strategy for global admissions."
      subtitle="Identify funding options, strengthen applications, and coordinate scholarship deadlines alongside university admissions."
      overviewTitle="Funding support requires timing and evidence."
      overviewBody="We help students identify realistic scholarships and prepare the academic, personal, and financial evidence needed for stronger applications."
      points={[
        { title: "Scholarship mapping", body: "Track merit, need-based, institution, and external funding opportunities." },
        { title: "Eligibility review", body: "Assess academic, test score, profile, and documentation requirements." },
        { title: "Application support", body: "Help shape statements, achievements, and supporting evidence." },
        { title: "Deadline control", body: "Coordinate scholarship timelines with admission and visa milestones." },
      ]}
      outcomes={[
        "A realistic funding plan across selected universities.",
        "Improved application materials for scholarship review.",
        "Reduced deadline risk through coordinated planning.",
        "Better clarity for family budgeting and final decisions.",
      ]}
      ctaTitle="Explore scholarship possibilities."
      ctaBody="Ask our counsellors to review your profile and identify funding routes worth pursuing."
      primaryLabel="Review my profile"
      secondaryHref="/global-education/admission-process"
      secondaryLabel="Admission process"
    />
  );
}