import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/global-education/contact")({
  head: () => ({
    meta: [
      { title: "Contact HIGAET Global Education Hub" },
      { name: "description", content: "Contact HIGAET Global Education Hub for study abroad counselling, university applications, scholarships, visa guidance, and student services." },
    ],
  }),
  component: GlobalContactPage,
});

function GlobalContactPage() {
  return (
    <DivisionDetailPage
      brand="global"
      eyebrow="Global Hub contact"
      title="Talk to a HIGAET study abroad counsellor."
      subtitle="Tell us your destination goals, academic background, budget, and preferred intake. We’ll help you understand your options."
      overviewTitle="Counselling for international admissions."
      overviewBody="Use this route for university shortlisting, application planning, scholarship questions, visa preparation, and student service guidance."
      points={[
        { title: "Destination advice", body: "Compare countries, intakes, programs, costs, and long-term pathways." },
        { title: "University shortlists", body: "Identify realistic and ambitious options based on profile fit." },
        { title: "Application planning", body: "Clarify SOPs, recommendations, documents, and deadline strategy." },
        { title: "Visa next steps", body: "Understand what preparation may be required after offers arrive." },
      ]}
      outcomes={[
        "A clearer view of your study abroad options.",
        "Suggested next steps based on your profile and timeline.",
        "Guidance on documents, scholarships, and visa readiness.",
        "Follow-up from an appropriate Global Hub counsellor.",
      ]}
      ctaTitle="Ready to plan your study abroad journey?"
      ctaBody="Submit your enquiry and a counsellor will respond within one business day."
      primaryLabel="Send enquiry"
      secondaryHref="/global-education/admission-process"
      secondaryLabel="See process"
      leadDivision="global"
      leadSource="global_contact"
    />
  );
}