import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/academy/internships")({
  head: () => ({
    meta: [
      { title: "AI Internships — HIGAET Academy" },
      { name: "description", content: "Applied AI internship pathways for HIGAET learners to gain project experience, mentorship, and portfolio evidence." },
    ],
  }),
  component: InternshipsPage,
});

function InternshipsPage() {
  return (
    <DivisionDetailPage
      brand="academy"
      eyebrow="Internships"
      title="Applied AI internships for practical experience."
      subtitle="Guided internship pathways that help learners move from course projects to real-world delivery patterns and professional habits."
      overviewTitle="Experience that turns learning into evidence."
      overviewBody="Internship tracks focus on scoped assignments, mentor reviews, delivery discipline, and final outputs that can support placement conversations."
      points={[
        { title: "Scoped assignments", body: "Work on defined problems with clear deliverables, timelines, and review criteria." },
        { title: "Mentorship", body: "Get feedback on implementation, communication, and professional execution." },
        { title: "Portfolio output", body: "Create demonstrable artifacts that explain the problem, approach, and result." },
        { title: "Work readiness", body: "Practice the habits expected in modern engineering and AI teams." },
      ]}
      outcomes={[
        "Practical experience beyond classroom exercises.",
        "Documented project work for resumes and interviews.",
        "Better readiness for junior AI and software roles.",
        "Mentor feedback on technical and professional growth areas.",
      ]}
      ctaTitle="Explore internship eligibility."
      ctaBody="Ask admissions which programs lead into internship pathways and what preparation is required."
      primaryLabel="Ask admissions"
      secondaryHref="/academy/online-courses"
      secondaryLabel="Online programs"
    />
  );
}