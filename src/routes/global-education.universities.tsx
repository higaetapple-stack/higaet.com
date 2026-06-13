import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/global-education/universities")({
  head: () => ({
    meta: [
      { title: "Partner Universities — HIGAET Global Education Hub" },
      { name: "description", content: "Explore HIGAET Global Education Hub university pathways, partner institutions, and best-fit program shortlisting support." },
    ],
    links: [{ rel: "canonical", href: "/global-education/universities" }],
  }),
  component: UniversitiesPage,
});

function UniversitiesPage() {
  return (
    <DivisionDetailPage
      brand="global"
      eyebrow="Universities"
      title="University pathways matched to your profile."
      subtitle="A structured approach to identifying institutions where your academics, goals, budget, and timeline can realistically align."
      overviewTitle="Shortlists built for fit and outcomes."
      overviewBody="We help students compare institutions beyond ranking: course structure, entry requirements, scholarships, work routes, and long-term opportunity."
      points={[
        { title: "Fit analysis", body: "Compare academic requirements, acceptance probability, budget, and location preferences." },
        { title: "Program depth", body: "Review curriculum, credits, practical exposure, and progression routes." },
        { title: "Partner guidance", body: "Use institutional relationships where available to clarify process and documentation." },
        { title: "Decision support", body: "Help families compare offers, deadlines, deposits, and risk factors clearly." },
      ]}
      outcomes={[
        "Balanced shortlist across ambitious, target, and safer options.",
        "Better understanding of course fit and career relevance.",
        "Clear documentation checklist for each institution.",
        "Informed final decision when offers arrive.",
      ]}
      ctaTitle="Build your university shortlist."
      ctaBody="Share your profile and destination goals so our counsellors can map realistic options."
      primaryLabel="Start shortlisting"
      secondaryHref="/global-education/countries"
      secondaryLabel="Compare countries"
    />
  );
}