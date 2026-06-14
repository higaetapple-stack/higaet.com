/**
 * HIGAET Academy — Learning Path Registry
 * ---------------------------------------------------------------
 * Canonical, single source of truth for Academy learning paths.
 *
 * Layer:        src/content/academy/learning-paths.ts
 * Workstream:   A.2 — Step 4
 * Contract:     `LearningPathEntry` (see src/content/_registry/types.ts)
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - Data only. No presentation, no JSX, no CSS, no helpers.
 *   - `id` is a PERMANENT business key — never rename or reuse.
 *   - `courseIds` references `CourseEntry.id` from `ACADEMY_COURSES`.
 *     The order of the array IS the curriculum sequence.
 *   - Learning paths are ORCHESTRATORS, not new content. Never
 *     duplicate course-level outcomes, modules, or FAQs here.
 *   - Every `published` path MUST carry complete SEO metadata.
 *   - Original HIGAET content only.
 *
 * BACKEND MAPPING (v1.6):
 *   academy_learning_paths         → top-level fields
 *   academy_learning_path_courses  → `courseIds` (sequence preserved
 *                                    via a `position` column)
 * ---------------------------------------------------------------
 */

import type { LearningPathEntry } from "@/content/_registry/types";

/* ----------------------------------------------------------------
 * Shared audit defaults
 * ---------------------------------------------------------------- */

const AUTHOR = "HIGAET" as const;
const CREATED_AT = "2026-06-14T00:00:00.000Z" as const;
const UPDATED_AT = "2026-06-14T00:00:00.000Z" as const;
const ENTRY_VERSION = "1.0.0" as const;

/* ----------------------------------------------------------------
 * Course ID constants
 *
 * Hardcoded as string literals (not imported from courses.ts) to
 * keep this file free of cross-file runtime coupling. The
 * registry validator verifies these resolve to real courses.
 * ---------------------------------------------------------------- */

const C_GENAI_FOUNDATIONS = "academy_course_genai_foundations";
const C_APPLIED_LLM = "academy_course_applied_llm_engineering";
const C_RAG_SYSTEMS = "academy_course_rag_systems";
const C_CERT_GENAI_ENGINEER = "academy_course_cert_genai_engineer";
const C_CERT_PROMPT = "academy_course_cert_prompt_engineering";
const C_BOOTCAMP_AI_ENGINEER = "academy_course_bootcamp_ai_engineer";
const C_BOOTCAMP_LLMOPS = "academy_course_bootcamp_llmops";
const C_EXEC_AI_STRATEGY = "academy_course_exec_ai_strategy";
const C_WORKSHOP_EVALS = "academy_course_workshop_evals";

/* ----------------------------------------------------------------
 * Learning Path Registry
 *
 * Seed set: 4 role-oriented journeys mapped to HIGAET's hiring
 * partner demand profile.
 * ---------------------------------------------------------------- */

export const ACADEMY_LEARNING_PATHS: readonly LearningPathEntry[] = [
  {
    id: "academy_path_ai_engineer",
    slug: "ai-engineer",
    status: "published",
    visibility: "public",
    title: "Become an AI Engineer",
    summary:
      "A structured journey from Generative AI fundamentals to production-grade LLM systems — the HIGAET path to a hireable AI engineering role.",
    audience: "Working software engineers moving into Generative AI",
    duration: "~9 months",
    courseIds: [
      C_GENAI_FOUNDATIONS,
      C_APPLIED_LLM,
      C_RAG_SYSTEMS,
      C_BOOTCAMP_AI_ENGINEER,
      C_CERT_GENAI_ENGINEER,
    ],
    metadata: {
      title: "Become an AI Engineer — Learning Path | HIGAET Academy",
      description:
        "HIGAET Academy's AI Engineer learning path — five sequenced programs that take working engineers to a job-ready Generative AI engineering profile.",
      keywords: [
        "ai engineer path",
        "generative ai career",
        "llm engineer roadmap",
        "higaet learning path",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_path_genai_application_developer",
    slug: "genai-application-developer",
    status: "published",
    visibility: "public",
    title: "GenAI Application Developer",
    summary:
      "Specialize in building user-facing Generative AI products — prompt design, retrieval, evaluation, and shipping with confidence.",
    audience: "Full-stack developers shipping LLM-powered features",
    duration: "~5 months",
    courseIds: [
      C_GENAI_FOUNDATIONS,
      C_CERT_PROMPT,
      C_RAG_SYSTEMS,
      C_APPLIED_LLM,
    ],
    metadata: {
      title: "GenAI Application Developer Path | HIGAET Academy",
      description:
        "HIGAET Academy's GenAI Application Developer path — prompt design, retrieval, evaluation, and shipping LLM-powered product features end-to-end.",
      keywords: [
        "genai developer path",
        "llm application developer",
        "ai product engineer",
        "higaet learning path",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_path_llmops_specialist",
    slug: "llmops-specialist",
    status: "published",
    visibility: "public",
    title: "LLMOps Specialist",
    summary:
      "Own the operational lifecycle of LLM systems — evaluation, observability, cost control, safety, and incident response at scale.",
    audience: "Platform, SRE, and MLOps engineers operating LLM workloads",
    duration: "~6 months",
    courseIds: [
      C_GENAI_FOUNDATIONS,
      C_APPLIED_LLM,
      C_WORKSHOP_EVALS,
      C_BOOTCAMP_LLMOPS,
    ],
    metadata: {
      title: "LLMOps Specialist Path | HIGAET Academy",
      description:
        "HIGAET Academy's LLMOps Specialist path — evaluation, observability, cost control, safety, and incident response for production LLM workloads.",
      keywords: [
        "llmops path",
        "llm operations career",
        "ai sre",
        "higaet learning path",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_path_ai_leader",
    slug: "ai-leader",
    status: "published",
    visibility: "public",
    title: "AI Leader",
    summary:
      "A leadership-focused journey that pairs working AI fluency with the strategy, portfolio, and governance skills modern executives need.",
    audience: "Senior leaders driving Generative AI adoption",
    duration: "~4 months",
    courseIds: [
      C_GENAI_FOUNDATIONS,
      C_EXEC_AI_STRATEGY,
    ],
    metadata: {
      title: "AI Leader Learning Path | HIGAET Academy",
      description:
        "HIGAET Academy's AI Leader path — working Generative AI fluency paired with executive strategy, portfolio design, and governance practices.",
      keywords: [
        "ai leader path",
        "executive ai program",
        "ai strategy course",
        "higaet learning path",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
] as const;

/**
 * Frozen list of all learning path IDs in the Academy registry.
 * Derived from `ACADEMY_LEARNING_PATHS`; exported for cross-
 * registry reference validation (e.g. testimonials `subjectId`).
 */
export const ACADEMY_LEARNING_PATH_IDS: readonly string[] =
  ACADEMY_LEARNING_PATHS.map((p) => p.id);
