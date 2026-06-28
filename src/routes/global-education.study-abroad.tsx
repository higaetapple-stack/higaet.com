import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";
import { buildServiceJsonLdScripts } from "@/lib/seo/service-schema";
import { SERVICE_SCHEMAS } from "@/lib/seo/global-education-services";

export const Route = createFileRoute("/global-education/study-abroad")({
  head: () => ({
    meta: [
      { title: "Study Abroad Counselling — HIGAET Global Education Hub" },
      { name: "description", content: "Study abroad counselling for students planning international admissions, university shortlists, applications, and visa pathways." },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/global-education/study-abroad" }],
    scripts: buildServiceJsonLdScripts(SERVICE_SCHEMAS["study-abroad"]),
  }),
  component: StudyAbroadPage,
});

function StudyAbroadPage() {
  return (
    <DivisionDetailPage
      brand="global"
      eyebrow="Study abroad"
      title="Study abroad planning with a complete admissions pathway."
      subtitle="Counselling, university shortlisting, applications, scholarships, and visa guidance for students pursuing global education."
      overviewTitle="A guided route from ambition to admission."
      overviewBody="HIGAET Global Education Hub helps students turn broad international goals into a clear country, university, program, and application strategy."
      points={[
        { title: "Profile review", body: "Assess academics, goals, budget, timelines, and destination preferences before shortlisting." },
        { title: "Program matching", body: "Map student profiles to practical university and course options." },
        { title: "Application support", body: "Coordinate documentation, SOPs, recommendations, and submission timelines." },
        { title: "Visa planning", body: "Prepare the financial, academic, and personal documentation required for visa confidence." },
      ]}
      outcomes={[
        "A country and university shortlist aligned to student goals.",
        "Clear application timeline with document responsibilities.",
        "Improved readiness for scholarships and visa stages.",
        "Ongoing counsellor support through each admissions milestone.",
      ]}
      ctaTitle="Plan your study abroad journey with HIGAET."
      ctaBody="Book a consultation to understand destinations, deadlines, and the best-fit application strategy."
      primaryLabel="Book consultation"
      secondaryHref="/global-education/universities"
      secondaryLabel="Browse universities"
    />
  );
}