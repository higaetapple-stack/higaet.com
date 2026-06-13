import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/technologies/saas-products")({
  head: () => ({
    meta: [
      { title: "SaaS Product Development — HIGAET Technologies" },
      { name: "description", content: "SaaS product strategy, design, engineering, launch, and growth support for partners and enterprises." },
    ],
    links: [{ rel: "canonical", href: "/technologies/saas-products" }],
  }),
  component: SaasProductsPage,
});

function SaasProductsPage() {
  return (
    <DivisionDetailPage
      brand="tech"
      eyebrow="SaaS products"
      title="SaaS products built from problem clarity to launch."
      subtitle="Strategy, product design, engineering, infrastructure, and iteration support for scalable software businesses."
      overviewTitle="A product operating model, not just a codebase."
      overviewBody="We help partners define SaaS propositions, validate workflows, ship usable product, and prepare for growth with reliable architecture."
      points={[
        { title: "Product strategy", body: "Clarify user segments, workflows, monetization, and launch priorities." },
        { title: "MVP delivery", body: "Build focused releases that prove value quickly without compromising foundations." },
        { title: "Platform architecture", body: "Design tenant, billing, admin, data, and integration patterns for growth." },
        { title: "Iteration support", body: "Use analytics and feedback to improve product-market fit after launch." },
      ]}
      outcomes={[
        "A practical roadmap from idea to launch-ready SaaS.",
        "Reusable architecture for accounts, permissions, data, and billing.",
        "A launch plan connected to user acquisition and retention.",
        "Engineering support for continuous product improvement.",
      ]}
      ctaTitle="Turn a SaaS idea into a working product."
      ctaBody="Share your product concept and we’ll map the fastest credible route to launch."
      primaryLabel="Discuss SaaS build"
      secondaryHref="/technologies/product-development"
      secondaryLabel="Product development"
    />
  );
}