import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  GraduationCap,
  Globe2,
  Cpu,
  CheckCircle2,
  Network,
} from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { DivisionCard } from "@/components/site/DivisionCard";
import { StatBand } from "@/components/site/StatBand";
import { CTASection } from "@/components/site/CTASection";
import { Section, Eyebrow } from "@/components/site/Section";
import { DIVISIONS, SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.name} — ${SITE.tagline}` },
      { name: "description", content: SITE.description },
      { property: "og:title", content: `${SITE.name} — ${SITE.tagline}` },
      { property: "og:description", content: SITE.description },
      { property: "og:url", content: "https://www.higaet.com/" },
      { property: "og:image", content: "https://www.higaet.com/og-higaet.png" },
    ],
  }),
  component: HomePage,
});

const STATS = [
  { value: "450+", label: "Partner Universities" },
  { value: "12k", label: "Graduates Placed" },
  { value: "94%", label: "Visa Success Rate" },
  { value: "15+", label: "Proprietary SaaS Tools" },
];

function HomePage() {
  return (
    <SiteShell>
      {/* Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.
                                            
                                            Security Finding: [Critical vulnerabilities in application dependencies
Internal ID: vulnerable_dependencies_critical
Scanner: supply_chain
Level: warn
Description: Critical severity vulnerabilities detected in your project dependencies. These require immediate attention.

| Package | Version | Advisory |
|---------|---------|----------|
| @tanstack/react-router | 1.168.25 | [seroval: `seroval.fromJSON()` Promise resolver type confusion invokes attacker-controlled methods during deserialization (via seroval)](https://github.com/advisories/GHSA-mv8w-475r-vwqw) |
| @tanstack/react-start | 1.167.50 | [seroval: `seroval.fromJSON()` Promise resolver type confusion invokes attacker-controlled methods during deserialization (via seroval)](https://github.com/advisories/GHSA-mv8w-475r-vwqw) |
| @tanstack/router-plugin | 1.167.28 | [seroval: `seroval.fromJSON()` Promise resolver type confusion invokes attacker-controlled methods during deserialization (via seroval)](https://github.com/advisories/GHSA-mv8w-475r-vwqw) |
] */}
      {/* Hero */}
      <header className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-[52ch]">
            <h1 className="font-display text-5xl md:text-6xl font-medium tracking-tight leading-[1.02] text-balance mb-8 text-ink">
              Advancing human capability through Generative Intelligence.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-pretty max-w-[44ch]">
              Helen Institute of Gen AI Engineering &amp; Technology bridges the gap between
              foundational research and industrial application across education and software.
            </p>
          </div>
        </div>
      </header>

      {/* Division switcher — signature pattern */}
      <Section className="!pt-0 !pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border ring-1 ring-border overflow-hidden rounded-[16px]">
          <DivisionCard
            brand="academy"
            title={DIVISIONS.academy.name}
            body={DIVISIONS.academy.blurb}
            href={DIVISIONS.academy.slug}
            ctaLabel="Explore Programs"
            icon={GraduationCap}
          />
          <DivisionCard
            brand="global"
            title="Global Education"
            body={DIVISIONS.global.blurb}
            href={DIVISIONS.global.slug}
            ctaLabel="Study Abroad"
            icon={Globe2}
          />
          <DivisionCard
            brand="tech"
            title="HIGAET Tech"
            body={DIVISIONS.tech.blurb}
            href={DIVISIONS.tech.slug}
            ctaLabel="Build with Us"
            icon={Cpu}
          />
        </div>
      </Section>

      <StatBand stats={STATS} />

      {/* Mission feature */}
      <Section>
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="lg:w-7/12">
            <div className="w-full aspect-[4/3] bg-muted rounded-[12px] outline outline-1 -outline-offset-1 outline-border grid place-items-center overflow-hidden relative">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "16px 16px" }} aria-hidden />
              <div className="relative z-10 text-center px-8">
                <Network className="size-12 text-muted-foreground/40 mx-auto mb-4" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Institutional Campus &amp; Knowledge Graph
                </span>
              </div>
            </div>
          </div>
          <div className="lg:w-5/12 flex flex-col justify-center">
            <Eyebrow brand="academy">Our Mission</Eyebrow>
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mb-6 mt-4 text-balance leading-tight">
              Cultivating the workforce of the intelligence era.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-pretty max-w-[44ch]">
              HIGAET was founded on the principle that AI engineering should be accessible, practical,
              and globally integrated. We don't just teach the technology — we build the future
              alongside our partners.
            </p>
            <div className="flex flex-col gap-4">
              <Bullet
                title="Industry-verified curricula"
                body="Co-developed with Fortune 500 tech partners and active practitioners."
              />
              <Bullet
                title="Direct university pipelines"
                body="Seamless credit transfers to US, UK, EU, and APAC institutions."
              />
              <Bullet
                title="Enterprise engineering arm"
                body="Education research feeds straight into our software and AI products."
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Why HIGAET — three pillars */}
      <Section className="bg-muted/30">
        <Eyebrow>Why HIGAET</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[24ch] text-balance">
          One institute. Three integrated paths into the AI economy.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Pillar
            number="01"
            title="Learn"
            body="Industry-grade Gen AI curricula taught online and on campus by working engineers, with placement-backed outcomes."
          />
          <Pillar
            number="02"
            title="Move"
            body="University partnerships, scholarship guidance, and visa support to take your education global."
          />
          <Pillar
            number="03"
            title="Build"
            body="Enterprise software, SaaS products, and applied AI solutions delivered by the engineering arm."
          />
        </div>
      </Section>

      <CTASection
        eyebrow="Talk to HIGAET"
        title="Ready to define your trajectory?"
        body="Speak with an advisor or engineering consultant today to explore which division fits your objectives."
        primaryHref="/contact"
        primaryLabel="Schedule Consultation"
        secondaryHref="/about"
        secondaryLabel="About the institute"
      />
    </SiteShell>
  );
}

function Bullet({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl ring-1 ring-border bg-card">
      <div className="shrink-0 size-8 bg-muted rounded-md flex items-center justify-center">
        <CheckCircle2 className="size-4 text-ink" aria-hidden />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-1 text-ink">{title}</h3>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Pillar({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <article className="p-8 rounded-2xl bg-card ring-1 ring-border">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{number}</span>
      <h3 className="font-display text-2xl font-medium mt-3 mb-3 text-ink">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </article>
  );
}
