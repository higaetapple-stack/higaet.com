import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/global-education/countries")({
  head: () => ({
    meta: [
      { title: "Study Destinations — HIGAET Global Education Hub" },
      { name: "description", content: "Compare study destinations including the UK, US, Canada, Australia, Ireland, Germany, Singapore, and more." },
    ],
    links: [{ rel: "canonical", href: "/global-education/countries" }],
  }),
  component: CountriesPage,
});

function CountriesPage() {
  return (
    <DivisionDetailPage
      brand="global"
      eyebrow="Countries"
      title="Choose the right country for your study and career plans."
      subtitle="Compare destinations by program quality, budget, visa rules, work opportunities, and long-term fit."
      overviewTitle="Destination choice shapes the whole journey."
      overviewBody="Our counsellors help students understand how each country affects admissions, cost, work options, culture, and post-study routes."
      points={[
        { title: "Country comparison", body: "Review academic systems, intakes, costs, scholarships, and living requirements." },
        { title: "Career pathways", body: "Understand work rights, post-study routes, and industry opportunities by destination." },
        { title: "Budget planning", body: "Estimate tuition, living costs, deposits, insurance, and financial documentation." },
        { title: "Family guidance", body: "Help students and families make confident, practical decisions together." },
      ]}
      outcomes={[
        "A destination shortlist aligned to academic and financial realities.",
        "Clear understanding of visa and post-study implications.",
        "Better university decisions within each chosen country.",
        "Reduced uncertainty before applications begin.",
      ]}
      ctaTitle="Compare your best-fit study destinations."
      ctaBody="Speak with a counsellor before committing to a country or intake."
      primaryLabel="Compare destinations"
      secondaryHref="/global-education/study-abroad"
      secondaryLabel="Study abroad"
    />
  );
}