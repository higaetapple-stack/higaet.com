import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { HubRelatedLinks } from "@/components/site/HubRelatedLinks";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";

const OPENINGS = [
  { slug: "senior-ai-engineer", title: "Senior AI Engineer", team: "Technologies", location: "Bengaluru / Remote", type: "Full-time" },
  { slug: "curriculum-lead-genai", title: "Curriculum Lead — Generative AI", team: "Academy", location: "Bengaluru", type: "Full-time" },
  { slug: "admissions-counsellor-uk", title: "Admissions Counsellor — UK Track", team: "Global Hub", location: "Hyderabad", type: "Full-time" },
  { slug: "fullstack-engineer", title: "Full-Stack Engineer", team: "Technologies", location: "Remote (IST ±3)", type: "Full-time" },
  { slug: "growth-marketing-manager", title: "Growth Marketing Manager", team: "HIGAET", location: "Bengaluru", type: "Full-time" },
  { slug: "visa-advisor-canada", title: "Visa Advisor — Canada Track", team: "Global Hub", location: "Mumbai", type: "Full-time" },
];

export const Route = createFileRoute("/careers")({
  head: () => {
    const url = "https://www.higaet.com/careers";
    const jobs = [
      { slug: "senior-ai-engineer", title: "Senior AI Engineer" },
      { slug: "curriculum-lead-genai", title: "Curriculum Lead — Generative AI" },
      { slug: "admissions-counsellor-uk", title: "Admissions Counsellor — UK Track" },
      { slug: "fullstack-engineer", title: "Full-Stack Engineer" },
      { slug: "growth-marketing-manager", title: "Growth Marketing Manager" },
      { slug: "visa-advisor-canada", title: "Visa Advisor — Canada Track" },
    ];
    return {
      meta: [
        { title: "Careers at HIGAET — Build the institute of the AI era" },
        { name: "description", content: "Open roles at HIGAET across Academy, Global Education Hub, and Technologies." },
        { property: "og:title", content: "Careers at HIGAET" },
        { property: "og:description", content: "Open roles across Academy, Global Education Hub, and Technologies." },
        { property: "og:url", content: url },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: jobs.map((j, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: j.title,
              url: "https://www.higaet.com/careers/" + j.slug,
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.higaet.com/" },
              { "@type": "ListItem", "position": 2, "name": "Careers", "item": url },
            ],
          }),
        },
      ],
    };
  },  component: CareersPage,
});

function CareersPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Careers"
        title="Build the institute of the AI era."
        subtitle="HIGAET hires educators, engineers, and operators who want to shape how the next generation of AI talent is built and deployed."
      />

      <Section className="!pt-0">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl font-medium text-ink">Open roles</h2>
          <span className="text-sm text-muted-foreground">{OPENINGS.length} positions</span>
        </div>
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl overflow-hidden bg-card">
          {OPENINGS.map((job) => (
            <li key={job.slug}>
              <Link
                to="/careers/$slug"
                params={{ slug: job.slug }}
                className="group flex items-center justify-between gap-6 p-6 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <h3 className="font-display text-lg font-medium text-ink">{job.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Briefcase className="size-3.5" /> {job.team}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {job.location}</span>
                    <span>{job.type}</span>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-ink group-hover:translate-x-1 transition-all" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <HubRelatedLinks
        eyebrow="Keep exploring"
        title="More ways to join HIGAET."
        links={[
          {
            to: "/jobs",
            label: "All job openings",
            body: "Browse every open job across Academy, Global Hub, and Technologies in one place.",
          },
          {
            to: "/contact",
            label: "Talk to our team",
            body: "Questions about a role, referrals, or general applications — start here.",
          },
        ]}
      />

      <CTASection
        title="Don't see your role?"
        body="We're always interested in meeting strong educators, engineers, and operators. Send us an introduction."
        primaryLabel="Contact our team"
      />
    </SiteShell>
  );
}
