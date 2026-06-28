import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { ArrowLeft, MapPin, Briefcase } from "lucide-react";

type Job = {
  slug: string;
  title: string;
  team: string;
  location: string;
  type: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
};

const JOBS: Record<string, Job> = {
  "senior-ai-engineer": {
    slug: "senior-ai-engineer",
    title: "Senior AI Engineer",
    team: "Technologies",
    location: "Bengaluru / Remote",
    type: "Full-time",
    summary:
      "Lead applied AI engagements for enterprise clients. Design, build, and deploy LLM-based systems end-to-end.",
    responsibilities: [
      "Own technical delivery for two to three concurrent client engagements.",
      "Design retrieval pipelines, agent architectures, and evaluation systems.",
      "Mentor junior engineers and contribute reusable internal tooling.",
    ],
    requirements: [
      "5+ years of software engineering experience, 1+ years in production AI/ML.",
      "Deep familiarity with at least one major LLM provider and vector store.",
      "Strong written communication — you can explain trade-offs to non-technical stakeholders.",
    ],
  },
  "curriculum-lead-genai": {
    slug: "curriculum-lead-genai",
    title: "Curriculum Lead — Generative AI",
    team: "Academy",
    location: "Bengaluru",
    type: "Full-time",
    summary: "Own the Academy's flagship Generative AI track from syllabus to outcomes.",
    responsibilities: [
      "Define learning outcomes, lesson sequencing, and assessment for the GenAI track.",
      "Recruit and onboard practitioner-instructors.",
      "Partner with placement on employer-aligned capstones.",
    ],
    requirements: [
      "Experience teaching or training engineers in industry or higher-ed.",
      "Hands-on familiarity with LLM application development.",
      "Track record of shipping curriculum at scale.",
    ],
  },
  "admissions-counsellor-uk": {
    slug: "admissions-counsellor-uk",
    title: "Admissions Counsellor — UK Track",
    team: "Global Hub",
    location: "Hyderabad",
    type: "Full-time",
    summary: "Guide students through admissions to UK partner universities.",
    responsibilities: [
      "Counsel applicants on programme fit, financials, and timelines.",
      "Manage applications end-to-end across 30+ UK institutions.",
      "Maintain conversion and outcome metrics.",
    ],
    requirements: [
      "2+ years in education counselling, ideally UK-focused.",
      "Strong written English and CRM discipline.",
    ],
  },
  "fullstack-engineer": {
    slug: "fullstack-engineer",
    title: "Full-Stack Engineer",
    team: "Technologies",
    location: "Remote (IST ±3)",
    type: "Full-time",
    summary: "Build the products and platforms behind HIGAET's enterprise offerings.",
    responsibilities: [
      "Ship features across TypeScript / React / Node and our data layer.",
      "Pair with AI engineers to productionise model integrations.",
      "Own deploys, observability, and on-call rotations.",
    ],
    requirements: [
      "3+ years building production web apps.",
      "Comfortable across the stack and willing to learn what's missing.",
    ],
  },
  "growth-marketing-manager": {
    slug: "growth-marketing-manager",
    title: "Growth Marketing Manager",
    team: "HIGAET",
    location: "Bengaluru",
    type: "Full-time",
    summary: "Own demand generation across all three HIGAET divisions.",
    responsibilities: [
      "Run paid and organic acquisition for Academy, Global Hub, and Technologies.",
      "Build the funnel: landing pages, lead nurture, attribution.",
      "Partner with content on AEO/GEO and SEO output.",
    ],
    requirements: [
      "4+ years in growth marketing, ideally B2C + B2B mix.",
      "Numerate, comfortable in GA4 / GTM / Meta Ads / LinkedIn.",
    ],
  },
  "visa-advisor-canada": {
    slug: "visa-advisor-canada",
    title: "Visa Advisor — Canada Track",
    team: "Global Hub",
    location: "Mumbai",
    type: "Full-time",
    summary: "Guide HIGAET students through Canadian study-permit applications.",
    responsibilities: [
      "Prepare SOPs, financial documentation, and IRCC submissions.",
      "Track visa outcomes and refine the process accordingly.",
    ],
    requirements: [
      "Demonstrable Canadian study-permit experience.",
      "Calm under pressure, organised, document-disciplined.",
    ],
  },
};

export const Route = createFileRoute("/careers/$slug")({
  loader: ({ params }) => {
    const job = JOBS[params.slug];
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => {
    const job = loaderData?.job;
    if (!job)
      return {
        meta: [{ title: "Role not found — HIGAET Careers" }],
      };
    const title = `${job.title} — HIGAET Careers`;
    return {
      meta: [
        { title },
        { name: "description", content: job.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: job.summary },
        { property: "og:url", content: `/careers/${job.slug}` },
        { property: "og:type", content: "article" },
      ],
      links: [` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: job.title,
            description: job.summary,
            employmentType: job.type.toUpperCase().replace("-", "_"),
            hiringOrganization: { "@type": "Organization", name: "HIGAET" },
            jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } },
            datePosted: new Date().toISOString().slice(0, 10),
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <Section>
        <h1 className="font-display text-3xl font-medium text-ink mb-4">Role not found</h1>
        <Link to="/careers" className="text-sm text-ink underline">
          See all open roles
        </Link>
      </Section>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <Section>
        <h1 className="font-display text-3xl font-medium text-ink mb-4">Something went wrong</h1>
        <Link to="/careers" className="text-sm text-ink underline">
          Back to careers
        </Link>
      </Section>
    </SiteShell>
  ),
  component: JobPage,
});

function JobPage() {
  const { job } = Route.useLoaderData();
  return (
    <SiteShell>
      <Section className="!py-16">
        <Link to="/careers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink mb-8">
          <ArrowLeft className="size-4" /> All roles
        </Link>
        <header className="max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-4 text-balance text-ink">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Briefcase className="size-3.5" /> {job.team}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {job.location}</span>
            <span>{job.type}</span>
          </div>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{job.summary}</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 mt-16 max-w-5xl">
          <div>
            <h2 className="font-display text-xl font-medium mb-4 text-ink">What you'll do</h2>
            <ul className="space-y-3 text-muted-foreground">
              {job.responsibilities.map((r: string) => (
                <li key={r} className="flex gap-3"><span className="text-ink mt-1.5">·</span>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-medium mb-4 text-ink">What we look for</h2>
            <ul className="space-y-3 text-muted-foreground">
              {job.requirements.map((r: string) => (
                <li key={r} className="flex gap-3"><span className="text-ink mt-1.5">·</span>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-ink text-surface text-sm font-medium px-5 py-3 rounded-md hover:bg-ink/90 transition-colors"
          >
            Apply for this role
          </Link>
        </div>
      </Section>
    </SiteShell>
  );
}
