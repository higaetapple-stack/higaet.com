import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";
import { HubLongform } from "@/components/site/HubLongform";
import { buildServiceJsonLdScripts } from "@/lib/seo/service-schema";
import { SERVICE_SCHEMAS } from "@/lib/seo/global-education-services";

export const Route = createFileRoute("/global-education/visa-guidance")({
  head: () => ({
    meta: [
      { title: "Student Visa Guidance — HIGAET Global Education Hub" },
      { name: "description", content: "Student visa guidance for documentation, financial readiness, mock interviews, and pre-departure preparation." },
    ],
    scripts: buildServiceJsonLdScripts(SERVICE_SCHEMAS["visa-guidance"]),
  }),
  component: VisaGuidancePage,
});

function VisaGuidancePage() {
  return (
    <>
      <DivisionDetailPage
        brand="global"
        eyebrow="Visa guidance"
        title="Student visa preparation with document discipline."
        subtitle="Guidance for financial evidence, documentation, interviews, and pre-departure readiness after admission."
        overviewTitle="Visa success depends on clarity and consistency."
        overviewBody="We help students prepare visa files carefully, with attention to destination-specific rules, financial records, admission documents, and interview confidence."
        points={[
          { title: "Document checklist", body: "Organize admission letters, IDs, financial evidence, academic records, and supporting files." },
          { title: "Financial readiness", body: "Review funds, deposits, sponsors, and country-specific proof requirements." },
          { title: "Mock interviews", body: "Practice clear answers around study intent, funding, and future plans." },
          { title: "Pre-departure", body: "Coordinate travel, accommodation, insurance, and arrival preparation." },
        ]}
        outcomes={[
          "A cleaner, more complete visa documentation file.",
          "Better confidence for embassy or credibility interviews.",
          "Reduced risk from inconsistent or missing information.",
          "A practical pre-departure checklist before travel.",
        ]}
        ctaTitle="Prepare your student visa file carefully."
        ctaBody="Talk to our counsellors about destination-specific visa requirements and timelines."
        primaryLabel="Get visa guidance"
        secondaryHref="/global-education/student-services"
        secondaryLabel="Student services"
      />
      <HubLongform clusterId="global-visa-funding" />
    </>
  );
}