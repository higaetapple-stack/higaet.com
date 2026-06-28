import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/technologies/product-development")({
  head: () => ({
    meta: [
      { title: "Product Development — HIGAET Technologies" },
      { name: "description", content: "Product discovery, UX, prototyping, engineering, launch planning, and iteration support from HIGAET Technologies." },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/technologies/product-development" }],
  }),
  component: ProductDevelopmentPage,
});

function ProductDevelopmentPage() {
  return (
    <DivisionDetailPage
      brand="tech"
      eyebrow="Product development"
      title="From product idea to usable, testable release."
      subtitle="Discovery, UX, prototyping, engineering, launch planning, and iteration support for digital products."
      overviewTitle="Product development needs evidence at every stage."
      overviewBody="We help teams reduce uncertainty by validating user needs, shaping workflows, building focused releases, and learning from real usage."
      points={[
        { title: "Discovery", body: "Clarify users, jobs, constraints, risks, and success metrics before building." },
        { title: "UX workflows", body: "Design interfaces and user journeys around practical task completion." },
        { title: "Prototype to MVP", body: "Move from concept validation into focused, production-minded releases." },
        { title: "Iteration loops", body: "Use feedback and analytics to guide product improvements after launch." },
      ]}
      outcomes={[
        "A clearer product scope connected to user needs.",
        "Prototype and MVP plans with realistic delivery priorities.",
        "Improved collaboration between business, design, and engineering.",
        "A stronger foundation for market launch and iteration.",
      ]}
      ctaTitle="Shape your product before you scale it."
      ctaBody="Bring your product challenge to HIGAET Technologies and we’ll map the next build phase."
      primaryLabel="Plan product build"
      secondaryHref="/technologies/saas-products"
      secondaryLabel="SaaS products"
    />
  );
}