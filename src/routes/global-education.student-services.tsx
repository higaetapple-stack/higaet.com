import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";
import { buildServiceJsonLdScripts } from "@/lib/seo/service-schema";
import { SERVICE_SCHEMAS } from "@/lib/seo/global-education-services";

export const Route = createFileRoute("/global-education/student-services")({
  head: () => ({
    meta: [
      { title: "International Student Services — HIGAET Global Education Hub" },
      { name: "description", content: "Student support services for accommodation, pre-departure orientation, travel planning, and arrival readiness." },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/global-education/student-services" }],
    scripts: buildServiceJsonLdScripts(SERVICE_SCHEMAS["student-services"]),
  }),
  component: StudentServicesPage,
});

function StudentServicesPage() {
  return (
    <DivisionDetailPage
      brand="global"
      eyebrow="Student services"
      title="Support beyond admission, through arrival and transition."
      subtitle="Practical student services covering pre-departure planning, accommodation guidance, travel readiness, and transition support."
      overviewTitle="The journey continues after the offer letter."
      overviewBody="Students need clear operational support as they move from admission to travel, settlement, and early campus life."
      points={[
        { title: "Pre-departure sessions", body: "Prepare for academics, culture, finances, travel, and campus expectations." },
        { title: "Accommodation guidance", body: "Understand housing options, deposits, timelines, and location trade-offs." },
        { title: "Travel planning", body: "Coordinate arrival windows, documents, insurance, and airport readiness." },
        { title: "Transition support", body: "Help students organize early steps after landing and starting university." },
      ]}
      outcomes={[
        "Reduced uncertainty between visa approval and travel.",
        "Better preparation for living and studying abroad.",
        "Clear checklist for accommodation, money, documents, and arrival.",
        "More confident transition into international student life.",
      ]}
      ctaTitle="Prepare for your move abroad."
      ctaBody="Ask our team about pre-departure and transition support for your destination."
      primaryLabel="Get student support"
      secondaryHref="/global-education/visa-guidance"
      secondaryLabel="Visa guidance"
    />
  );
}