import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { StatBand } from "@/components/site/StatBand";
import { CTASection } from "@/components/site/CTASection";
import { FeatureGrid } from "@/components/site/FeatureGrid";
import { Compass, BookOpen, ShieldCheck, Users2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About HIGAET — A global institute for the AI era" },
      {
        name: "description",
        content:
          "Helen Institute of Gen AI Engineering & Technology unites AI education, international university pathways, and enterprise engineering under one institution.",
      },
      { property: "og:title", content: "About HIGAET — A global institute for the AI era" },
      {
        property: "og:description",
        content:
          "HIGAET unites AI education, international university pathways, and enterprise engineering under one institution.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="About HIGAET"
        title="A global institute built for the intelligence era."
        subtitle="HIGAET unites three divisions — Academy, Global Education Hub, and Technologies — into a single ecosystem that learns, moves, and builds."
      />

      <Section className="!pt-0">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl">
          <p className="text-lg text-muted-foreground leading-relaxed">
            We were founded on a simple observation: the world's most ambitious AI work is happening
            inside companies that hire faster than universities can prepare graduates. HIGAET closes
            that gap by combining rigorous education, direct admission pathways into global
            universities, and a working enterprise engineering arm under one roof.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Our students learn from engineers who ship, our applicants are placed at universities
            where our partners actively recruit, and our enterprise clients gain access to a talent
            pipeline they helped shape.
          </p>
        </div>
      </Section>

      <StatBand
        stats={[
          { value: "2019", label: "Founded" },
          { value: "12k+", label: "Learners" },
          { value: "450+", label: "Partner Universities" },
          { value: "60+", label: "Enterprise Clients" },
        ]}
      />

      <Section>
        <span className="text-xs font-semibold uppercase tracking-widest text-ink">Principles</span>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[28ch] text-balance">
          The values that govern how HIGAET works.
        </h2>
        <FeatureGrid
          columns={4}
          features={[
            { icon: Compass, title: "Outcome-oriented", body: "We measure success in placements, admissions, and shipped products — not certificates." },
            { icon: BookOpen, title: "Practitioner-led", body: "Every program is built and taught by people doing the work today." },
            { icon: ShieldCheck, title: "Globally credible", body: "Curriculum and partnerships designed to transfer across borders and employers." },
            { icon: Users2, title: "Community first", body: "Alumni networks, faculty, and corporate partners function as one fabric." },
          ]}
        />
      </Section>

      <CTASection
        title="Partner, study, or build with HIGAET."
        body="Whether you're an aspiring engineer, a student looking abroad, or an enterprise team — let's talk."
      />
    </SiteShell>
  );
}
