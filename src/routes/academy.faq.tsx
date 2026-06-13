import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/academy/faq")({
  head: () => ({
    meta: [
      { title: "Academy FAQ — HIGAET Academy" },
      { name: "description", content: "Answers about HIGAET Academy programs, eligibility, schedules, certifications, internships, and placement support." },
    ],
    links: [{ rel: "canonical", href: "/academy/faq" }],
  }),
  component: AcademyFaqPage,
});

function AcademyFaqPage() {
  return (
    <DivisionDetailPage
      brand="academy"
      eyebrow="FAQ"
      title="Answers for future HIGAET Academy learners."
      subtitle="A practical summary of how Academy programs, formats, credentials, and career support work."
      overviewTitle="What to know before applying."
      overviewBody="Our admissions team helps learners choose the right path based on current skill level, schedule, and career objective."
      points={[
        { title: "Eligibility", body: "Programs are mapped by level, from foundations to advanced applied AI engineering." },
        { title: "Formats", body: "Selected tracks run online, offline, or in hybrid formats depending on cohort and location." },
        { title: "Assessments", body: "Learners progress through assignments, labs, and project reviews." },
        { title: "Career support", body: "Eligible tracks include structured preparation for internships or placement pathways." },
      ]}
      outcomes={[
        "Know which program level is appropriate for your background.",
        "Understand the difference between courses, certifications, and internships.",
        "Plan timelines around batches, assessments, and career goals.",
        "Get direct guidance from admissions when your situation is specific.",
      ]}
      ctaTitle="Still deciding which Academy path is right?"
      ctaBody="Send your questions and our admissions team will guide you clearly."
      primaryLabel="Ask a question"
      secondaryHref="/academy/online-courses"
      secondaryLabel="Explore courses"
    />
  );
}