import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Bot,
  Workflow,
  MessageSquareCode,
  Code2,
  Briefcase,
  GraduationCap,
  Users2,
  Building2,
  Rocket,
  Quote,
  Github,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { StatBand } from "@/components/site/StatBand";
import { CTASection } from "@/components/site/CTASection";
import { FAQ, faqJsonLd } from "@/components/site/FAQ";
import { PROGRAMS } from "@/lib/academy-programs";

const FLAGSHIP_SLUGS = [
  "gen-ai-engineering",
  "ai-agents-development",
  "prompt-engineering",
  "ai-automation-engineering",
  "full-stack-ai-development",
] as const;

const FLAGSHIP_ICONS: Record<string, typeof Sparkles> = {
  "gen-ai-engineering": Sparkles,
  "ai-agents-development": Bot,
  "prompt-engineering": MessageSquareCode,
  "ai-automation-engineering": Workflow,
  "full-stack-ai-development": Code2,
};

const LEARNING_PATHS = [
  { slug: "school-students", label: "School Students", body: "AI literacy and project-based learning from grade 9 upward." },
  { slug: "college-students", label: "College Students", body: "Career tracks that complement engineering and science degrees." },
  { slug: "working-professionals", label: "Working Professionals", body: "Switch into AI roles or level up your current craft." },
  { slug: "entrepreneurs", label: "Entrepreneurs", body: "Founder-focused programs on shipping AI products fast." },
  { slug: "corporate-teams", label: "Corporate Teams", body: "Custom upskilling for engineering, product, and operations." },
];

const CAREER_OUTCOMES = [
  { role: "AI Engineer", payRange: "₹12–32 L" },
  { role: "Prompt Engineer", payRange: "₹8–22 L" },
  { role: "AI Consultant", payRange: "₹15–40 L" },
  { role: "Automation Architect", payRange: "₹14–30 L" },
  { role: "AI Product Manager", payRange: "₹18–45 L" },
  { role: "Data Analyst (AI)", payRange: "₹9–22 L" },
];

const STUDENT_PROJECTS = [
  { title: "ClinicCopilot", blurb: "Multi-agent intake & triage assistant for a regional hospital network.", repo: "higaet-students/cliniccopilot" },
  { title: "PolicyRAG", blurb: "Retrieval system over 60k pages of insurance policies with answer attribution.", repo: "higaet-students/policyrag" },
  { title: "OpsLoop", blurb: "n8n + LLM automation suite that closes 30% of customer support tickets without humans.", repo: "higaet-students/opsloop" },
];

const FACULTY = [
  { name: "Dr. Anika Rao", role: "Program Director — Gen AI Engineering", note: "Ex-staff ML engineer; 12 years applied AI." },
  { name: "Vikram Iyer", role: "Lead Faculty — AI Systems", note: "Builds large-scale inference platforms." },
  { name: "Karthik Subramanian", role: "Program Director — AI Agents", note: "Agentic platforms for enterprise automation." },
  { name: "Sneha Reddy", role: "Program Director — Automation", note: "Automation lead at a global services firm." },
];

const TESTIMONIALS = [
  {
    quote: "HIGAET's Gen AI track was the first program I'd seen that actually treated production as part of the curriculum. I shipped a real RAG system as my capstone and that's what landed my offer.",
    name: "Aditi S.",
    role: "AI Engineer, fintech",
  },
  {
    quote: "I switched from QA to AI Automation Engineering. Within six months I was leading internal workflow projects for my company.",
    name: "Rohit M.",
    role: "Automation Architect, BPO",
  },
  {
    quote: "The faculty are working practitioners. The feedback on my project work was the kind you get from a senior engineer at a real company.",
    name: "Pooja K.",
    role: "Full-Stack AI Developer, SaaS",
  },
];

const ADMISSIONS_STEPS = [
  { n: "01", title: "Apply", body: "5-minute form. Tell us your background and goal." },
  { n: "02", title: "Counselling", body: "20-minute conversation with a HIGAET advisor." },
  { n: "03", title: "Enrolment", body: "Confirm cohort, scholarship band, and payment plan." },
  { n: "04", title: "Learning", body: "Live cohorts, labs, mentor reviews, and capstones." },
  { n: "05", title: "Certification", body: "Industry-recognised HIGAET credential and outcomes record." },
  { n: "06", title: "Placement", body: "Dedicated placement counsellor and employer introductions." },
];

const FAQS = [
  { q: "Are HIGAET Academy programs recognised by employers?", a: "Yes. Our curricula are co-developed with hiring partners and aligned to industry role profiles. Graduates receive a HIGAET certificate plus a verified outcomes record." },
  { q: "Do you offer placement assistance?", a: "Yes — every Career Track program includes structured placement support: interview prep, employer introductions, and a dedicated placement counsellor through your job search." },
  { q: "Can I take Academy programs online?", a: "Most flagship programs are available both online (live cohorts) and on-campus. Some intensive bootcamps are on-campus only." },
  { q: "How are programs structured?", a: "Programs combine live instruction, recorded modules, hands-on labs, mentor reviews, and an enterprise capstone graded by industry practitioners." },
  { q: "What financing options are available?", a: "Most programs offer no-cost EMI from select partners, scholarships via the HIGAET Aptitude Test (HAT), and employer sponsorship paperwork." },
  { q: "What if I'm not technical yet?", a: "Start with our Foundation programs (Prompt Engineering, Foundations of AI) and step up to a Career Track once you're ready." },
];

export const Route = createFileRoute("/academy/")({
  head: () => ({
    meta: [
      { title: "HIGAET Academy — AI engineering programs with placement support" },
      { name: "description", content: "Industry-aligned Gen AI, AI Agents, Automation, and Full-Stack programs with live cohorts, capstones, and dedicated placement support." },
      { property: "og:title", content: "HIGAET Academy" },
      { property: "og:description", content: "Become an AI Engineer. Build real AI products. Get industry mentorship and global placement support." },
      { property: "og:url", content: "/academy" },
    ],
    links: [{ rel: "canonical", href: "/academy" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(faqJsonLd(FAQS)) },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "HIGAET Academy",
          url: "/academy",
          parentOrganization: { "@type": "Organization", name: "HIGAET" },
        }),
      },
    ],
  }),
  component: AcademyHome,
});

function AcademyHome() {
  const flagships = FLAGSHIP_SLUGS.map((s) => PROGRAMS.find((p) => p.slug === s)).filter(Boolean) as typeof PROGRAMS;

  return (
    <>
      {/* 1 · Hero */}
      <PageHero
        brand="academy"
        eyebrow="HIGAET Academy"
        title="Become an AI Engineer. Build real AI products. Launch a global career."
        subtitle="Industry-aligned programs in Generative AI, AI Agents, Automation, and Full-Stack Development. Taught by working engineers. Backed by structured placement support."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/academy/admissions"
            className="bg-academy text-white text-sm font-medium px-4 py-2.5 rounded-md inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            Apply now <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/academy/admissions"
            search={{ intent: "counselling" }}
            className="ring-1 ring-border text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors"
          >
            Book counselling
          </Link>
          <Link
            to="/academy/programs"
            className="text-academy text-sm font-medium px-4 py-2.5 rounded-md hover:bg-academy/10 transition-colors inline-flex items-center gap-1.5"
          >
            Download brochure
          </Link>
        </div>
      </PageHero>

      {/* 2 · Trust indicators */}
      <StatBand
        stats={[
          { value: "12k+", label: "Learners trained" },
          { value: "18", label: "Countries served" },
          { value: "120+", label: "Industry mentors" },
          { value: "300+", label: "Placement partners" },
        ]}
      />

      {/* 3 · Flagship programs */}
      <Section>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <Eyebrow brand="academy">Flagship programs</Eyebrow>
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 max-w-[28ch] text-balance">
              Programs designed around what AI engineers actually do.
            </h2>
          </div>
          <Link to="/academy/programs" className="text-sm font-medium text-academy inline-flex items-center gap-1.5 hover:gap-2 transition-all">
            See all programs <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flagships.map((p) => {
            const Icon = FLAGSHIP_ICONS[p.slug] ?? Sparkles;
            return (
              <Link
                key={p.slug}
                to="/academy/programs/$slug"
                params={{ slug: p.slug }}
                className="group rounded-xl bg-card p-6 ring-1 ring-border hover:ring-foreground/20 transition flex flex-col"
              >
                <div className="size-10 rounded-lg bg-academy/10 text-academy grid place-items-center mb-5">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-medium text-ink">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.tagline}</p>
                <div className="mt-5 pt-5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.duration} · {p.format}</span>
                  <span className="text-academy font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Explore <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* 4 · Learning paths */}
      <Section className="bg-muted/30">
        <Eyebrow brand="academy">Learning paths</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[28ch] text-balance">
          Wherever you're starting from, there's a path forward.
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {LEARNING_PATHS.map((p) => (
            <Link
              key={p.slug}
              to="/academy/learning-paths"
              className="group rounded-xl bg-card p-5 ring-1 ring-border hover:ring-academy/40 transition"
            >
              <h3 className="font-display text-base font-medium text-ink">{p.label}</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.body}</p>
              <span className="text-xs text-academy font-medium mt-4 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                View path <ArrowRight className="size-3" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* 5 · Career outcomes */}
      <Section>
        <Eyebrow brand="academy">Career outcomes</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[30ch] text-balance">
          The roles HIGAET graduates step into.
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAREER_OUTCOMES.map((o) => (
            <div key={o.role} className="rounded-xl bg-card p-6 ring-1 ring-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="size-5 text-academy" />
                <span className="font-medium text-ink">{o.role}</span>
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">{o.payRange}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Indicative annual CTC ranges in INR based on HIGAET placement data and industry benchmarks. Actual offers vary by role, location, and experience.
        </p>
      </Section>

      {/* 6 · Student projects */}
      <Section className="bg-muted/30">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <Eyebrow brand="academy">Student projects</Eyebrow>
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 max-w-[28ch] text-balance">
              Real systems shipped by HIGAET cohorts.
            </h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STUDENT_PROJECTS.map((p) => (
            <div key={p.title} className="rounded-xl bg-card p-6 ring-1 ring-border">
              <h3 className="font-display text-lg font-medium text-ink">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.blurb}</p>
              <div className="mt-5 pt-5 border-t border-border inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Github className="size-4" /> {p.repo}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 7 · Faculty */}
      <Section>
        <Eyebrow brand="academy">Mentors &amp; faculty</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[30ch] text-balance">
          Practitioners who ship what they teach.
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FACULTY.map((f) => (
            <div key={f.name} className="rounded-xl bg-card p-6 ring-1 ring-border">
              <div className="size-12 rounded-full bg-academy/10 text-academy grid place-items-center mb-4">
                <GraduationCap className="size-5" />
              </div>
              <h3 className="font-display text-base font-medium text-ink">{f.name}</h3>
              <p className="text-xs uppercase tracking-wider text-academy mt-1">{f.role}</p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 8 · Success stories */}
      <Section className="bg-ink text-surface">
        <Eyebrow brand="academy">Success stories</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[28ch] text-surface text-balance">
          Graduates building careers in AI.
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-xl bg-surface/5 ring-1 ring-surface/10 p-6">
              <Quote className="size-5 text-academy" />
              <blockquote className="text-surface/90 text-sm leading-relaxed mt-4">{t.quote}</blockquote>
              <figcaption className="mt-5 pt-5 border-t border-surface/10">
                <div className="text-sm font-medium text-surface">{t.name}</div>
                <div className="text-xs text-surface/60 mt-0.5">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* 9 · Admissions process */}
      <Section>
        <Eyebrow brand="academy">Admissions process</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[30ch] text-balance">
          From application to placement, a structured path.
        </h2>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ADMISSIONS_STEPS.map((s) => (
            <li key={s.n} className="rounded-xl bg-card p-6 ring-1 ring-border">
              <div className="text-academy font-display text-2xl font-medium">{s.n}</div>
              <h3 className="font-display text-lg font-medium text-ink mt-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Link
            to="/academy/admissions"
            className="inline-flex items-center gap-2 bg-academy text-white text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
          >
            Start your application <ArrowRight className="size-4" />
          </Link>
        </div>
      </Section>

      {/* Quick links — Corporate & Enterprise */}
      <Section className="bg-muted/30 !py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/academy/corporate-training" className="rounded-xl bg-card p-6 ring-1 ring-border hover:ring-academy/40 transition group">
            <Building2 className="size-5 text-academy" />
            <h3 className="font-display text-lg font-medium text-ink mt-3">Corporate Training</h3>
            <p className="text-sm text-muted-foreground mt-1">Custom upskilling for engineering and product teams.</p>
          </Link>
          <Link to="/academy/placements" className="rounded-xl bg-card p-6 ring-1 ring-border hover:ring-academy/40 transition">
            <Users2 className="size-5 text-academy" />
            <h3 className="font-display text-lg font-medium text-ink mt-3">Placement ecosystem</h3>
            <p className="text-sm text-muted-foreground mt-1">300+ partners, dedicated counsellors, structured prep.</p>
          </Link>
          <Link to="/academy/scholarship" className="rounded-xl bg-card p-6 ring-1 ring-border hover:ring-academy/40 transition">
            <Rocket className="size-5 text-academy" />
            <h3 className="font-display text-lg font-medium text-ink mt-3">HAT scholarship</h3>
            <p className="text-sm text-muted-foreground mt-1">Merit awards up to 100% via the HIGAET Aptitude Test.</p>
          </Link>
        </div>
      </Section>

      {/* 10 · FAQ */}
      <Section>
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
          <div>
            <Eyebrow brand="academy">FAQ</Eyebrow>
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 text-balance max-w-[20ch]">
              Common questions, answered plainly.
            </h2>
          </div>
          <FAQ items={FAQS} />
        </div>
      </Section>

      <CTASection
        title="Start your AI engineering career with HIGAET Academy."
        body="Book a free counselling call to find the right program for your background and goals."
        primaryHref="/academy/admissions"
        primaryLabel="Apply now"
        secondaryHref="/academy/programs"
        secondaryLabel="Explore programs"
      />
    </>
  );
}
