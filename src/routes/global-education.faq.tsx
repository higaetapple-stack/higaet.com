import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/global-education/faq")({
  head: () => ({
    meta: [
      { title: "Study Abroad FAQ — HIGAET Global Education Hub" },
      { name: "description", content: "Answers to common study abroad questions about countries, universities, scholarships, visas, and counselling with HIGAET." },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/global-education/faq" }],
  }),
  component: GlobalFaqPage,
});

function GlobalFaqPage() {
  return (
    <DivisionDetailPage
      brand="global"
      eyebrow="FAQ"
      title="Answers for students planning international education."
      subtitle="A practical overview of study abroad planning, counselling, applications, scholarships, visas, and student services."
      overviewTitle="What to know before you begin."
      overviewBody="The best study abroad plan depends on your academics, budget, timeline, destination goals, and long-term career direction."
      points={[
        { title: "When to start", body: "Most students should begin six to twelve months before the target intake." },
        { title: "Where to apply", body: "Destination and university choice should balance ambition, affordability, and visa viability." },
        { title: "Scholarships", body: "Funding depends on profile strength, deadlines, university policy, and external awards." },
        { title: "Visa readiness", body: "Financial clarity, documentation, and study intent are critical to preparation." },
      ]}
      outcomes={[
        "Understand the major decisions in a study abroad journey.",
        "Know what documents and timelines usually matter most.",
        "Identify where expert counselling can reduce risk.",
        "Get direct support when your case needs specific advice.",
      ]}
      ctaTitle="Still have study abroad questions?"
      ctaBody="Send your query and a Global Hub counsellor will guide you through the next step."
      primaryLabel="Ask a counsellor"
      secondaryHref="/global-education/admission-process"
      secondaryLabel="See process"
    />
  );
}