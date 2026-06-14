/**
 * HIGAET Academy — Testimonials Registry
 * ---------------------------------------------------------------
 * Canonical, single source of truth for Academy testimonials.
 *
 * Layer:        src/content/academy/testimonials.ts
 * Workstream:   A.2 — Step 5
 * Contract:     `TestimonialEntry` (see src/content/_registry/types.ts)
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - Data only. No presentation, no JSX, no CSS, no helpers.
 *   - `id` is a PERMANENT business key — never rename or reuse.
 *   - `subjectId` (when present) MUST reference a published
 *     `CourseEntry.id` or `LearningPathEntry.id`. Referential
 *     integrity is enforced by the registry validator.
 *   - Every `published` testimonial MUST carry complete SEO
 *     metadata (used for JSON-LD `Review` emission).
 *   - Original HIGAET content only.
 *
 * PLACEHOLDER POLICY
 * ---------------------------------------------------------------
 * Every entry below is an ORIGINAL HIGAET-authored marketing
 * placeholder intended to be replaced with a verified alumni
 * quote (with written consent) before the next major Academy
 * release. Placeholders use:
 *
 *   - `name`     : composite first-name + initial only (no real
 *                  identities).
 *   - `author`   : `"HIGAET-Placeholder"` in the audit block so
 *                  consumers / dashboards can identify and swap
 *                  them without touching the schema.
 *   - `quote`    : original copy authored by HIGAET; not adapted
 *                  from any third-party education provider.
 *
 * Replacing a placeholder is NOT a breaking change: keep the same
 * `id`, update `name` / `role` / `company` / `quote` / `audit`.
 *
 * BACKEND MAPPING (v1.6):
 *   academy_testimonials → top-level fields
 * ---------------------------------------------------------------
 */

import type { TestimonialEntry } from "@/content/_registry/types";

/* ----------------------------------------------------------------
 * Shared audit defaults
 * ---------------------------------------------------------------- */

const PLACEHOLDER_AUTHOR = "HIGAET-Placeholder" as const;
const CREATED_AT = "2026-06-14T00:00:00.000Z" as const;
const UPDATED_AT = "2026-06-14T00:00:00.000Z" as const;
const ENTRY_VERSION = "1.0.0" as const;

/* ----------------------------------------------------------------
 * Subject ID constants
 *
 * Hardcoded string literals (not imported) to keep this file free
 * of cross-file runtime coupling. The validator verifies every
 * `subjectId` resolves to a real course or learning path.
 * ---------------------------------------------------------------- */

const C_GENAI_FOUNDATIONS = "academy_course_genai_foundations";
const C_APPLIED_LLM = "academy_course_applied_llm_engineering";
const C_RAG_SYSTEMS = "academy_course_rag_systems";
const C_BOOTCAMP_AI_ENGINEER = "academy_course_bootcamp_ai_engineer";
const C_BOOTCAMP_LLMOPS = "academy_course_bootcamp_llmops";
const C_EXEC_AI_STRATEGY = "academy_course_exec_ai_strategy";
const C_WORKSHOP_EVALS = "academy_course_workshop_evals";

const P_AI_ENGINEER = "academy_path_ai_engineer";
const P_GENAI_APP_DEV = "academy_path_genai_application_developer";
const P_LLMOPS = "academy_path_llmops_specialist";

/* ----------------------------------------------------------------
 * Testimonials Registry
 *
 * Seed set: 8 placeholder testimonials covering the major Academy
 * programs and learning paths. Replace each with verified alumni
 * quotes (with written consent) without changing the `id`.
 * ---------------------------------------------------------------- */

export const ACADEMY_TESTIMONIALS: readonly TestimonialEntry[] = [
  {
    id: "academy_testimonial_001",
    slug: "ai-engineer-bootcamp-priya-s",
    status: "published",
    visibility: "public",
    name: "Priya S.",
    role: "Senior Software Engineer",
    company: "FinTech scale-up",
    subjectId: C_BOOTCAMP_AI_ENGINEER,
    quote:
      "HIGAET's AI Engineer Bootcamp gave me the production discipline I was missing. Six months in, I'm leading our team's first RAG rollout with confidence.",
    metadata: {
      title: "Priya S. on the HIGAET AI Engineer Bootcamp",
      description:
        "HIGAET Academy alumna Priya S. on how the AI Engineer Bootcamp prepared her to lead her team's first production RAG rollout.",
      keywords: ["higaet review", "ai engineer bootcamp", "alumni story"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
  {
    id: "academy_testimonial_002",
    slug: "applied-llm-engineering-marcus-t",
    status: "published",
    visibility: "public",
    name: "Marcus T.",
    role: "Staff Engineer",
    company: "Healthcare SaaS",
    subjectId: C_APPLIED_LLM,
    quote:
      "Applied LLM Engineering reshaped how my team ships AI features. We now have evals in CI and our incident count dropped to nearly zero.",
    metadata: {
      title: "Marcus T. on Applied LLM Engineering at HIGAET",
      description:
        "How HIGAET Academy's Applied LLM Engineering course helped a staff engineer introduce CI evaluations and cut LLM incidents in production.",
      keywords: ["higaet review", "applied llm engineering", "llm evals"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
  {
    id: "academy_testimonial_003",
    slug: "genai-foundations-aisha-r",
    status: "published",
    visibility: "public",
    name: "Aisha R.",
    role: "Backend Developer",
    company: "Logistics platform",
    subjectId: C_GENAI_FOUNDATIONS,
    quote:
      "I came in skeptical about another AI course. HIGAET's Generative AI Foundations is the first one that actually explained the system, not just the hype.",
    metadata: {
      title: "Aisha R. on HIGAET Generative AI Foundations",
      description:
        "A backend developer's experience with HIGAET Academy's Generative AI Foundations — first principles, not hype.",
      keywords: ["higaet review", "generative ai foundations", "ai course"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
  {
    id: "academy_testimonial_004",
    slug: "rag-systems-david-k",
    status: "published",
    visibility: "public",
    name: "David K.",
    role: "ML Engineer",
    company: "Legal-tech startup",
    subjectId: C_RAG_SYSTEMS,
    quote:
      "Our retrieval quality jumped after week two. HIGAET's RAG course is what production looks like, not what a blog post pretends it is.",
    metadata: {
      title: "David K. on the HIGAET RAG Systems Course",
      description:
        "An ML engineer's account of how HIGAET Academy's RAG Systems course measurably improved his team's retrieval quality.",
      keywords: ["higaet review", "rag course", "retrieval quality"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
  {
    id: "academy_testimonial_005",
    slug: "llmops-bootcamp-noor-h",
    status: "published",
    visibility: "public",
    name: "Noor H.",
    role: "Platform Engineer",
    company: "Enterprise SaaS",
    subjectId: C_BOOTCAMP_LLMOPS,
    quote:
      "The LLMOps Bootcamp turned 'how do we monitor this?' into a tracked SLO. HIGAET made operating LLMs feel like operating anything else we own.",
    metadata: {
      title: "Noor H. on the HIGAET LLMOps Bootcamp",
      description:
        "A platform engineer on how HIGAET Academy's LLMOps Bootcamp gave her team production-grade SLOs for LLM workloads.",
      keywords: ["higaet review", "llmops bootcamp", "llm slo"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
  {
    id: "academy_testimonial_006",
    slug: "ai-strategy-leila-m",
    status: "published",
    visibility: "public",
    name: "Leila M.",
    role: "VP of Product",
    company: "Insurance group",
    subjectId: C_EXEC_AI_STRATEGY,
    quote:
      "HIGAET's AI Strategy program gave me the structure to defend our AI portfolio to the board — and the language to align engineering, legal, and risk.",
    metadata: {
      title: "Leila M. on HIGAET AI Strategy for Leaders",
      description:
        "A VP of Product on how HIGAET Academy's executive AI strategy program helped her align engineering, legal, and risk around an AI portfolio.",
      keywords: ["higaet review", "ai strategy", "executive ai program"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
  {
    id: "academy_testimonial_007",
    slug: "evals-workshop-jonas-b",
    status: "published",
    visibility: "public",
    name: "Jonas B.",
    role: "Tech Lead",
    company: "Developer-tools company",
    subjectId: C_WORKSHOP_EVALS,
    quote:
      "Two days, one golden-set, zero arguments about whether the model 'feels better' anymore. HIGAET's evals workshop paid for itself in a sprint.",
    metadata: {
      title: "Jonas B. on the HIGAET LLM Evaluation Workshop",
      description:
        "A tech lead on how HIGAET Academy's two-day evaluation workshop replaced subjective LLM debates with golden-set discipline.",
      keywords: ["higaet review", "llm evaluation workshop", "ai evals"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
  {
    id: "academy_testimonial_008",
    slug: "ai-engineer-path-arjun-v",
    status: "published",
    visibility: "public",
    name: "Arjun V.",
    role: "Generative AI Engineer",
    company: "Hired through HIGAET partner network",
    subjectId: P_AI_ENGINEER,
    quote:
      "The HIGAET AI Engineer path is the closest thing I've seen to a real curriculum for this role. I followed it end-to-end and walked into an offer.",
    metadata: {
      title: "Arjun V. on the HIGAET AI Engineer Learning Path",
      description:
        "An alumnus on completing HIGAET Academy's AI Engineer learning path end-to-end and landing a Generative AI engineering role through the partner network.",
      keywords: [
        "higaet review",
        "ai engineer learning path",
        "ai career",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
  {
    id: "academy_testimonial_009",
    slug: "genai-app-dev-path-sofia-l",
    status: "published",
    visibility: "public",
    name: "Sofia L.",
    role: "Full-stack Developer",
    company: "Consumer product startup",
    subjectId: P_GENAI_APP_DEV,
    quote:
      "I wanted to ship LLM features without faking it. HIGAET's GenAI Application Developer path gave me a real toolkit — prompts, retrieval, evals, and shipping.",
    metadata: {
      title: "Sofia L. on the HIGAET GenAI Application Developer Path",
      description:
        "A full-stack developer on completing HIGAET Academy's GenAI Application Developer path and shipping LLM features with discipline.",
      keywords: [
        "higaet review",
        "genai application developer",
        "llm features",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
  {
    id: "academy_testimonial_010",
    slug: "llmops-path-rahul-d",
    status: "published",
    visibility: "public",
    name: "Rahul D.",
    role: "Site Reliability Engineer",
    company: "Global e-commerce",
    subjectId: P_LLMOPS,
    quote:
      "HIGAET's LLMOps path felt like SRE for a new substrate. By the end I had dashboards, runbooks, and a postmortem template that my org adopted.",
    metadata: {
      title: "Rahul D. on the HIGAET LLMOps Specialist Path",
      description:
        "An SRE on completing HIGAET Academy's LLMOps Specialist path — dashboards, runbooks, and postmortem practices adopted across his organization.",
      keywords: ["higaet review", "llmops path", "ai sre"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: PLACEHOLDER_AUTHOR,
    },
  },
] as const;

/**
 * Frozen list of all testimonial IDs in the Academy registry.
 * Derived from `ACADEMY_TESTIMONIALS`; exported for downstream
 * validation and analytics joins.
 */
export const ACADEMY_TESTIMONIAL_IDS: readonly string[] =
  ACADEMY_TESTIMONIALS.map((t) => t.id);
