import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/technologies/digital-marketing")({
  head: () => ({
    meta: [
      { title: "Digital Marketing — HIGAET Technologies" },
      { name: "description", content: "Performance marketing, SEO, content systems, analytics, and growth workflows connected to product and technology strategy." },
    ],
  }),
  component: DigitalMarketingPage,
});

function DigitalMarketingPage() {
  return (
    <DivisionDetailPage
      brand="tech"
      eyebrow="Digital marketing"
      title="Growth systems connected to product and data."
      subtitle="Performance marketing, SEO, content, lifecycle, analytics, and conversion work aligned to your digital product strategy."
      overviewTitle="Marketing works best when it connects to the product engine."
      overviewBody="We combine campaign execution with analytics, landing pages, content systems, and funnel improvements so growth efforts become measurable."
      points={[
        { title: "Growth strategy", body: "Define audiences, acquisition channels, funnel goals, and measurement plans." },
        { title: "SEO & content", body: "Build search-aligned content systems around customer intent and topical authority." },
        { title: "Performance campaigns", body: "Plan paid campaigns with tracking, creative tests, and conversion feedback." },
        { title: "Analytics", body: "Connect dashboards, events, and reporting to decisions that improve outcomes." },
      ]}
      outcomes={[
        "A measurable acquisition and conversion plan.",
        "Better visibility into what channels and content drive results.",
        "Landing and funnel improvements tied to campaign learning.",
        "Marketing workflows that can scale with the business.",
      ]}
      ctaTitle="Build a measurable digital growth system."
      ctaBody="Tell us your product, audience, and growth target so we can recommend a focused plan."
      primaryLabel="Discuss growth"
      secondaryHref="/technologies/software-development"
      secondaryLabel="Software delivery"
    />
  );
}