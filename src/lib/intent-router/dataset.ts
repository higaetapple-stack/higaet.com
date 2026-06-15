/**
 * B.11 — AI Query Router · Intent Dataset
 * ---------------------------------------------------------------
 * Derived (NOT hardcoded) from existing graph sources:
 *   - PROGRAMS  (single source of truth — same as B.8 sitemap)
 *   - CAMPUSES  (single source of truth)
 *   - Academy static marketing surface (mirrors B.6 breadcrumb provider)
 *
 * Guardrails (B.11 spec):
 *   ❌ never invent routes
 *   ❌ never override registry truth
 *   ✔ every `path` MUST already exist in the validated route graph
 *
 * If a new route is added elsewhere, extend ONE of the source
 * registries above — do NOT add a literal entry here.
 */

import { PROGRAMS, CAMPUSES, CATEGORY_LABELS } from "@/lib/academy-programs";

export type IntentKind = "navigate" | "inform" | "apply" | "explore";

export interface IntentNode {
  path: string;
  title: string;
  description: string;
  keywords: readonly string[];
  synonyms: readonly string[];
  intent: IntentKind;
  weight: number;
}

/* ---------- Static Academy marketing surface ---------- */

const STATIC_INTENTS: IntentNode[] = [
  {
    path: "/academy",
    title: "HIGAET Academy",
    description: "Helen Institute of Gen AI Engineering & Technology — Academy home.",
    keywords: ["academy", "higaet academy", "school", "institute"],
    synonyms: ["education", "learning"],
    intent: "navigate",
    weight: 1.0,
  },
  {
    path: "/academy/programs",
    title: "Programs",
    description: "Flagship career-track programs across AI, Data, Cloud, Cyber, Product.",
    keywords: ["programs", "career track", "degree", "bootcamp"],
    synonyms: ["courses", "tracks"],
    intent: "explore",
    weight: 0.95,
  },
  {
    path: "/academy/online-courses",
    title: "Online Courses",
    description: "Self-paced online courses in AI and emerging tech.",
    keywords: ["online courses", "online", "self paced", "elearning", "remote learning"],
    synonyms: ["e-learning", "virtual classes", "mooc"],
    intent: "explore",
    weight: 0.9,
  },
  {
    path: "/academy/certifications",
    title: "Certifications",
    description: "Industry-recognized HIGAET certifications.",
    keywords: ["certification", "certificate", "credential", "badge"],
    synonyms: ["accreditation"],
    intent: "explore",
    weight: 0.85,
  },
  {
    path: "/academy/learning-paths",
    title: "Learning Paths",
    description: "Curated multi-course learning journeys.",
    keywords: ["learning path", "roadmap", "curriculum journey"],
    synonyms: ["track", "syllabus path"],
    intent: "explore",
    weight: 0.85,
  },
  {
    path: "/academy/campuses",
    title: "Campuses",
    description: "HIGAET physical campus locations.",
    keywords: ["campus", "campuses", "locations", "branch"],
    synonyms: ["centre", "center"],
    intent: "navigate",
    weight: 0.8,
  },
  {
    path: "/academy/corporate-training",
    title: "Corporate Training",
    description: "Custom upskilling programs for enterprise teams.",
    keywords: ["corporate training", "enterprise training", "b2b", "company"],
    synonyms: ["workforce training", "team upskilling"],
    intent: "inform",
    weight: 0.85,
  },
  {
    path: "/academy/offline-training",
    title: "Offline Training",
    description: "On-campus instructor-led programs.",
    keywords: ["offline", "in person", "classroom", "on campus"],
    synonyms: ["physical class", "face to face"],
    intent: "explore",
    weight: 0.75,
  },
  {
    path: "/academy/admissions",
    title: "Admissions",
    description: "Apply to HIGAET — eligibility, process, deadlines.",
    keywords: ["admission", "admissions", "apply", "enroll", "registration", "join"],
    synonyms: ["sign up", "register"],
    intent: "apply",
    weight: 1.0,
  },
  {
    path: "/academy/scholarship",
    title: "Scholarship",
    description: "Scholarships and financial aid options.",
    keywords: ["scholarship", "financial aid", "grant", "fee waiver"],
    synonyms: ["funding", "bursary"],
    intent: "inform",
    weight: 0.9,
  },
  {
    path: "/academy/placements",
    title: "Placements",
    description: "Placement outcomes and hiring partners.",
    keywords: ["placement", "placements", "jobs", "hiring", "career"],
    synonyms: ["recruitment outcomes"],
    intent: "inform",
    weight: 0.9,
  },
  {
    path: "/academy/internships",
    title: "Internships",
    description: "Internship programs and partners.",
    keywords: ["internship", "internships", "intern", "trainee"],
    synonyms: ["apprenticeship"],
    intent: "inform",
    weight: 0.85,
  },
  {
    path: "/academy/success-stories",
    title: "Success Stories",
    description: "Alumni outcomes and testimonials.",
    keywords: ["success stories", "alumni", "testimonials", "case study"],
    synonyms: ["student stories"],
    intent: "inform",
    weight: 0.7,
  },
  {
    path: "/academy/faq",
    title: "Academy FAQ",
    description: "Frequently asked questions.",
    keywords: ["faq", "questions", "help", "support"],
    synonyms: ["q&a", "queries"],
    intent: "inform",
    weight: 0.6,
  },
  {
    path: "/academy/contact",
    title: "Contact Academy",
    description: "Talk to HIGAET Academy.",
    keywords: ["contact", "talk to us", "reach out", "phone", "email"],
    synonyms: ["get in touch"],
    intent: "navigate",
    weight: 0.7,
  },
];

/* ---------- Derived: program detail pages ---------- */

const PROGRAM_INTENTS: IntentNode[] = PROGRAMS.map((p) => {
  const categoryLabel = CATEGORY_LABELS[p.category];
  return {
    path: `/academy/programs/${p.slug}`,
    title: p.title,
    description: p.tagline,
    keywords: [
      p.title.toLowerCase(),
      p.slug.replace(/-/g, " "),
      categoryLabel.toLowerCase(),
      p.category,
      `${p.category} program`,
      `${p.category} course`,
    ],
    synonyms: [
      ...p.outcomes.slice(0, 2).map((o) => o.toLowerCase()),
      p.level.toLowerCase(),
    ],
    intent: "apply" as const,
    weight: 1.0,
  };
});

/* ---------- Derived: campus detail pages ---------- */

const CAMPUS_INTENTS: IntentNode[] = CAMPUSES.map((c) => {
  const cityLower = c.city.toLowerCase();
  return {
    path: `/academy/campuses/${c.slug}`,
    title: c.name,
    description: `${c.name} — ${c.degree}.`,
    keywords: [
      cityLower,
      `${cityLower} campus`,
      `${cityLower} centre`,
      `${cityLower} center`,
      c.name.toLowerCase(),
    ],
    synonyms: [`study in ${cityLower}`, c.partnerType.toLowerCase()],
    intent: "navigate" as const,
    weight: 0.85,
  };
});

export const INTENT_DATASET: readonly IntentNode[] = [
  ...STATIC_INTENTS,
  ...PROGRAM_INTENTS,
  ...CAMPUS_INTENTS,
];
