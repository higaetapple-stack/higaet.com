import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";
import { buildServiceJsonLdScripts } from "@/lib/seo/service-schema";
import { SERVICE_SCHEMAS } from "@/lib/seo/global-education-services";

export const Route = createFileRoute("/global-education/admission-process")({
  head: () => ({
    meta: [
      { title: "Admission Process — HIGAET Global Education Hub" },
      { name: "description", content: "Understand the HIGAET Global Education Hub admissions process from profile review and shortlisting to applications, offers, and visa support." },
    ],
    scripts: buildServiceJsonLdScripts(SERVICE_SCHEMAS["admission-process"]),
  }),
  component: AdmissionProcessPage,
});

function AdmissionProcessPage() {
  return (
    <DivisionDetailPage
      brand="global"
      eyebrow="Admission process"
      title="A clear process from profile review to enrolment."
      subtitle="Step-by-step counselling for shortlisting, applications, scholarship planning, offers, visa guidance, and pre-departure support."
      overviewTitle="Admissions work best when every milestone is visible."
      overviewBody="We structure the journey into practical stages so students and families know what must happen, when, and why."
      points={[
        { title: "Profile & goal review", body: "Clarify destination, course, budget, academic fit, and timeline." },
        { title: "Shortlisting", body: "Create university and program options across ambition, fit, and safety categories." },
        { title: "Applications", body: "Prepare documents, SOPs, recommendations, and submissions with deadline control." },
        { title: "Offer to visa", body: "Support offer decisions, deposits, visa documentation, and pre-departure planning." },
      ]}
      outcomes={[
        "A transparent roadmap for the full admissions cycle.",
        "Clear ownership of documents, deadlines, and next steps.",
        "Better coordination between scholarships, offers, and visa timing.",
        "Counsellor support through key decision points.",
      ]}
      ctaTitle="Start with a structured admissions plan."
      ctaBody="Book a consultation and leave with a clear picture of your next steps."
      primaryLabel="Book consultation"
      secondaryHref="/global-education/study-abroad"
      secondaryLabel="Study abroad"
    />
  );
}