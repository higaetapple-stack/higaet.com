import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Users2, Briefcase, Rocket, Building2 } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { getAcademyLearningPaths, getAcademyBreadcrumbs } from "@/content/providers";
import {
  buildAcademyHeadMeta,
  buildBreadcrumbJsonLd,
  buildLearningPathsItemListJsonLd,
} from "@/lib/seo/academy-metadata";

export const Route = createFileRoute("/academy/learning-paths")({
  head: () => {
    const path = "/academy/learning-paths";
    const paths = getAcademyLearningPaths();
    const trail = getAcademyBreadcrumbs(path);
    return {
      ...buildAcademyHeadMeta({
        title: "Learning Paths — HIGAET Academy",
        description:
          "Choose a learning path based on where you are today — school student, college student, working professional, entrepreneur, or corporate team.",
        path,
      }),
      scripts: [
        buildLearningPathsItemListJsonLd(paths, path),
        ...(trail.length ? [buildBreadcrumbJsonLd(trail)] : []),
      ],
    };
  },
  component: LearningPaths,
});

type Path = {
  slug: string;
  icon: typeof GraduationCap;
  label: string;
  who: string;
  startWith: { slug: string; title: string }[];
  outcome: string;
};

const PATHS: Path[] = [
  {
    slug: "school-students",
    icon: GraduationCap,
    label: "School Students",
    who: "Grade 9–12 learners curious about AI, coding, and building things.",
    startWith: [
      { slug: "prompt-engineering", title: "Prompt Engineering" },
      { slug: "foundations-of-ai", title: "Foundations of AI" },
    ],
    outcome: "AI literacy, a portfolio project, and a clear roadmap into engineering streams.",
  },
  {
    slug: "college-students",
    icon: Users2,
    label: "College Students",
    who: "Engineering, science, and quant students who want a credible AI specialisation alongside their degree.",
    startWith: [
      { slug: "gen-ai-engineering", title: "Generative AI Engineering" },
      { slug: "full-stack-ai-development", title: "Full-Stack AI Development" },
    ],
    outcome: "Career-track program, real capstone, and placement support that complements your campus placements.",
  },
  {
    slug: "working-professionals",
    icon: Briefcase,
    label: "Working Professionals",
    who: "Software engineers, analysts, and PMs switching into AI roles or upgrading their craft.",
    startWith: [
      { slug: "ai-agents-development", title: "AI Agents Development" },
      { slug: "ai-automation-engineering", title: "AI Automation Engineering" },
      { slug: "applied-data-science", title: "Applied Data Science" },
    ],
    outcome: "Role-aligned skills, employer-recognised credential, and a placement counsellor through your switch.",
  },
  {
    slug: "entrepreneurs",
    icon: Rocket,
    label: "Entrepreneurs",
    who: "Founders and operators shipping AI-native products and workflows.",
    startWith: [
      { slug: "ai-product-management", title: "AI Product Management" },
      { slug: "full-stack-ai-development", title: "Full-Stack AI Development" },
    ],
    outcome: "Product judgment, technical fluency, and a network of practitioners and capital partners.",
  },
  {
    slug: "corporate-teams",
    icon: Building2,
    label: "Corporate Teams",
    who: "Engineering, product, and operations teams adopting AI at scale.",
    startWith: [],
    outcome: "Custom curriculum, on-site or live cohorts, measurable ROI on team upskilling.",
  },
];

function LearningPaths() {
  return (
    <>
      <PageHero
        brand="academy"
        eyebrow="Academy · Learning paths"
        title="Pick the path that fits where you are today."
        subtitle="Five structured paths from school to enterprise. Each one maps to specific HIGAET programs, outcomes, and placement support."
      />

      <Section className="!pt-0">
        <div className="space-y-6">
          {PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <article key={p.slug} className="rounded-2xl bg-card ring-1 ring-border p-8 grid lg:grid-cols-[1.2fr_2fr] gap-8">
                <div>
                  <div className="size-10 rounded-lg bg-academy/10 text-academy grid place-items-center mb-4">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="font-display text-2xl font-medium text-ink">{p.label}</h2>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{p.who}</p>
                </div>
                <div>
                  {p.startWith.length > 0 && (
                    <>
                      <Eyebrow brand="academy">Start with</Eyebrow>
                      <ul className="mt-3 grid sm:grid-cols-2 gap-2">
                        {p.startWith.map((s) => (
                          <li key={s.slug}>
                            <Link
                              to="/academy/programs/$slug"
                              params={{ slug: s.slug }}
                              className="flex items-center justify-between gap-3 rounded-md ring-1 ring-border px-3 py-2 text-sm text-ink hover:ring-academy/40 hover:bg-academy/5 transition"
                            >
                              {s.title}
                              <ArrowRight className="size-3.5 text-academy" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="mt-6 pt-6 border-t border-border">
                    <Eyebrow brand="academy">Outcome</Eyebrow>
                    <p className="text-sm text-ink mt-2 leading-relaxed">{p.outcome}</p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {p.slug === "corporate-teams" ? (
                      <Link
                        to="/academy/corporate-training"
                        className="inline-flex items-center gap-2 bg-academy text-white text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
                      >
                        Design a corporate program <ArrowRight className="size-4" />
                      </Link>
                    ) : (
                      <Link
                        to="/academy/admissions"
                        className="inline-flex items-center gap-2 bg-academy text-white text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
                      >
                        Apply for this path <ArrowRight className="size-4" />
                      </Link>
                    )}
                    <Link
                      to="/academy/programs"
                      className="ring-1 ring-border text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors"
                    >
                      Browse all programs
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <CTASection
        title="Not sure which path is right?"
        body="Book a 20-minute counselling call. We'll map your background and goal to the right HIGAET program."
        primaryHref="/academy/admissions"
        primaryLabel="Book counselling"
        secondaryHref="/academy/scholarship"
        secondaryLabel="Explore scholarships"
      />
    </>
  );
}
