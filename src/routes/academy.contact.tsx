import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/academy/contact")({
  head: () => ({
    meta: [
      { title: "Contact HIGAET Academy Admissions" },
      { name: "description", content: "Contact HIGAET Academy admissions for online courses, offline training, certifications, internships, and placement support." },
    ],
  }),
  component: AcademyContactPage,
});

function AcademyContactPage() {
  return (
    <DivisionDetailPage
      brand="academy"
      eyebrow="Academy contact"
      title="Talk to HIGAET Academy admissions."
      subtitle="Share your learning goal, background, and preferred format. Our admissions team will recommend the next practical step."
      overviewTitle="Admissions guidance for AI learners."
      overviewBody="Use this route for program selection, batch availability, eligibility, fees, certification routes, and placement support questions."
      points={[
        { title: "Program fit", body: "Find the right online, offline, certification, or internship-linked pathway." },
        { title: "Batch planning", body: "Understand upcoming schedules, learning commitment, and format options." },
        { title: "Career goals", body: "Discuss how your target role maps to Academy programs and placement support." },
        { title: "Next steps", body: "Get a clear action plan after your enquiry is reviewed." },
      ]}
      outcomes={[
        "A recommended program route based on your profile.",
        "Clarity on schedule, learning mode, and preparation required.",
        "Answers to certification, internship, and placement questions.",
        "Follow-up from the appropriate Academy advisor.",
      ]}
      ctaTitle="Ready to start with HIGAET Academy?"
      ctaBody="Submit your enquiry and an admissions advisor will respond within one business day."
      primaryLabel="Send enquiry"
      secondaryHref="/academy/online-courses"
      secondaryLabel="View courses"
      leadDivision="academy"
      leadSource="academy_contact"
    />
  );
}