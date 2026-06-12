import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Code2, Megaphone, Rocket } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { StatBand } from "@/components/site/StatBand";
import { CTASection } from "@/components/site/CTASection";
import { FeatureGrid } from "@/components/site/FeatureGrid";

export const Route = createFileRoute("/technologies/")({
  head: () => ({
    meta: [
      { title: "HIGAET Technologies — Enterprise AI engineering & software" },
      { name: "description", content: "Custom software, applied AI, and SaaS products for enterprises. The engineering arm of HIGAET." },
      { property: "og:title", content: "HIGAET Technologies" },
      { property: "og:description", content: "Enterprise AI engineering and software, from HIGAET." },
      { property: "og:url", content: "/technologies" },
    ],
    links: [{ rel: "canonical", href: "/technologies" }],
  }),
  component: TechHome,
});

function TechHome() {
  return (
    <>
      <PageHero
        brand="tech"
        eyebrow="HIGAET Technologies"
        title="Ship production-grade AI, faster than the market."
        subtitle="We deliver applied AI engineering and custom software for enterprises — backed by an institute with deep talent and research roots."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/technologies/case-studies"
            className="bg-tech text-white text-sm font-medium px-4 py-2.5 rounded-md inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            See case studies <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/technologies/contact"
            className="ring-1 ring-border text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors"
          >
            Start a project
          </Link>
        </div>
      </PageHero>

      <StatBand
        stats={[
          { value: "60+", label: "Enterprise clients" },
          { value: "15+", label: "Live SaaS products" },
          { value: "120+", label: "AI engineers" },
          { value: "3", label: "Continents" },
        ]}
      />

      <Section>
        <span className="text-xs font-semibold uppercase tracking-widest text-tech">Practice areas</span>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[30ch] text-balance">
          Full-stack engineering with an applied AI core.
        </h2>
        <FeatureGrid
          brand="tech"
          columns={4}
          features={[
            { icon: Cpu, title: "Applied AI solutions", body: "Retrieval, agents, evaluations, and AI ops — built for real production constraints." },
            { icon: Code2, title: "Custom software", body: "Web, mobile, and platform engineering with senior engineers, not staffing churn." },
            { icon: Rocket, title: "SaaS product development", body: "From discovery to launch — we co-build and operate SaaS for partners." },
            { icon: Megaphone, title: "Digital marketing", body: "Performance, content, and lifecycle — informed by your product analytics." },
          ]}
        />
      </Section>

      <CTASection
        title="Start a project with HIGAET Technologies."
        body="Tell us about your problem. We'll come back with a recommended team, scope, and timeline."
        primaryHref="/technologies/contact"
        primaryLabel="Start a project"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
      />
    </>
  );
}
