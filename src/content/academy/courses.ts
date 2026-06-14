/**
 * HIGAET Academy — Course Registry
 * ---------------------------------------------------------------
 * Canonical, single source of truth for HIGAET Academy courses.
 *
 * Layer:        src/content/academy/courses.ts
 * Workstream:   A.2 — Step 3
 * Contract:     `CourseEntry` (see src/content/_registry/types.ts)
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - Data only. No presentation, no JSX, no CSS, no helpers.
 *   - `id` is a PERMANENT business key — never rename or reuse.
 *   - `slug` is a routing concern and may evolve (with redirects).
 *   - `categoryId` MUST reference a published category in
 *     `ACADEMY_CATEGORIES`. Referential integrity is enforced by
 *     the registry validator.
 *   - Every `published` course MUST carry complete SEO metadata.
 *   - Original HIGAET content only. Never adapt third-party copy.
 *
 * BACKEND MAPPING (v1.6):
 *   academy_courses          → top-level fields
 *   academy_course_outcomes  → `outcomes`
 *   academy_course_modules   → `curriculum`
 *   academy_course_faqs      → `faqs`
 *
 * The shape stays stable across the backend swap; only the
 * provider implementation changes.
 * ---------------------------------------------------------------
 */

import type { CourseEntry } from "@/content/_registry/types";

/* ----------------------------------------------------------------
 * Shared audit defaults
 * ---------------------------------------------------------------- */

const AUTHOR = "HIGAET" as const;
const CREATED_AT = "2026-06-14T00:00:00.000Z" as const;
const UPDATED_AT = "2026-06-14T00:00:00.000Z" as const;
const ENTRY_VERSION = "1.0.0" as const;

/* ----------------------------------------------------------------
 * Category ID constants
 *
 * Hardcoded as string literals (not imported from categories.ts)
 * to keep this file free of cross-file runtime coupling. The
 * registry validator verifies these resolve to real categories.
 * ---------------------------------------------------------------- */

const CAT_ONLINE_COURSES = "academy_category_online_courses";
const CAT_CERTIFICATIONS = "academy_category_certifications";
const CAT_BOOTCAMPS = "academy_category_bootcamps";
const CAT_EXECUTIVE = "academy_category_executive_programs";
const CAT_WORKSHOPS = "academy_category_workshops";
const CAT_ENTERPRISE = "academy_category_enterprise_training";

/* ----------------------------------------------------------------
 * Course Registry
 *
 * Seed set: 10 representative courses covering every published
 * category except Learning Paths (which is a derived surface).
 * ---------------------------------------------------------------- */

export const ACADEMY_COURSES: readonly CourseEntry[] = [
  // ============================================================
  // Online Courses
  // ============================================================
  {
    id: "academy_course_genai_foundations",
    slug: "generative-ai-foundations",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "Generative AI Foundations",
    summary:
      "Build a rigorous mental model of modern Generative AI — from tokens and embeddings to transformers, fine-tuning, and evaluation.",
    duration: "8 weeks",
    level: "beginner",
    mode: "online",
    outcomes: [
      "Explain how modern LLMs are trained, served, and evaluated.",
      "Design prompts and structured outputs for reliable LLM behavior.",
      "Choose between RAG, fine-tuning, and tool-use for a given problem.",
      "Ship a working LLM-powered prototype with sensible guardrails.",
    ],
    curriculum: [
      "Week 1 — The Generative AI landscape",
      "Week 2 — Tokens, embeddings, and the transformer block",
      "Week 3 — Prompting patterns and structured outputs",
      "Week 4 — Retrieval-Augmented Generation in practice",
      "Week 5 — Fine-tuning vs. adapters vs. prompting",
      "Week 6 — Evaluation, eval datasets, and regression testing",
      "Week 7 — Safety, guardrails, and responsible deployment",
      "Week 8 — Capstone: ship a production-grade LLM prototype",
    ],
    faqs: [
      {
        question: "Do I need a machine learning background?",
        answer:
          "No. The course assumes general programming literacy and builds the ML intuition you need from first principles.",
      },
      {
        question: "What does 'online' mean at HIGAET?",
        answer:
          "Self-paced video modules plus weekly live office hours with HIGAET engineers and a private learner community.",
      },
    ],
    metadata: {
      title: "Generative AI Foundations Course | HIGAET Academy",
      description:
        "An 8-week online Generative AI foundations course covering LLMs, RAG, fine-tuning, evaluation, and safe deployment — taught by HIGAET engineers.",
      keywords: [
        "generative ai course",
        "llm course",
        "rag course",
        "ai foundations",
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
    id: "academy_course_applied_llm_engineering",
    slug: "applied-llm-engineering",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "Applied LLM Engineering",
    summary:
      "Move from prompt experiments to production: orchestration, evals, observability, and cost control for LLM systems.",
    duration: "10 weeks",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Architect LLM applications with clear separation of orchestration, retrieval, and tools.",
      "Build offline and online evaluation pipelines that catch regressions.",
      "Instrument LLM systems for latency, cost, and quality observability.",
      "Operate LLM workloads with sensible rate limits, fallbacks, and circuit breakers.",
    ],
    curriculum: [
      "Module 1 — From prompts to systems",
      "Module 2 — Orchestration frameworks and routing",
      "Module 3 — Retrieval pipelines that actually work",
      "Module 4 — Tool use and function calling",
      "Module 5 — Offline evals and golden sets",
      "Module 6 — Online evals and human-in-the-loop",
      "Module 7 — Observability, tracing, and cost",
      "Module 8 — Safety, abuse, and red-teaming",
      "Module 9 — Deployment patterns",
      "Module 10 — Capstone project review",
    ],
    metadata: {
      title: "Applied LLM Engineering Course | HIGAET Academy",
      description:
        "A 10-week applied LLM engineering course covering orchestration, retrieval, evaluation, observability, and production operations of GenAI systems.",
      keywords: [
        "llm engineering course",
        "production llm",
        "llm observability",
        "llm evaluation",
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
    id: "academy_course_rag_systems",
    slug: "retrieval-augmented-generation-systems",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "Retrieval-Augmented Generation Systems",
    summary:
      "Design and ship RAG pipelines that are accurate, observable, and cheap to operate at scale.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Choose chunking, embedding, and indexing strategies for your corpus.",
      "Diagnose retrieval failures using recall, precision, and groundedness metrics.",
      "Implement hybrid search, re-ranking, and query rewriting.",
      "Operate vector databases with sensible cost and freshness controls.",
    ],
    curriculum: [
      "Week 1 — When RAG is the right answer",
      "Week 2 — Chunking, embeddings, and indexes",
      "Week 3 — Hybrid search and re-ranking",
      "Week 4 — Evaluating retrieval and generation",
      "Week 5 — Operating vector stores in production",
      "Week 6 — Capstone: a measurable RAG system",
    ],
    metadata: {
      title: "RAG Systems Course | HIGAET Academy",
      description:
        "Hands-on Retrieval-Augmented Generation course — chunking, hybrid search, re-ranking, evaluation, and production vector store operations.",
      keywords: [
        "rag course",
        "retrieval augmented generation",
        "vector database course",
        "hybrid search",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },

  // ============================================================
  // Certifications
  // ============================================================
  {
    id: "academy_course_cert_genai_engineer",
    slug: "certified-generative-ai-engineer",
    status: "published",
    visibility: "public",
    categoryId: CAT_CERTIFICATIONS,
    title: "Certified Generative AI Engineer",
    summary:
      "A proctored HIGAET credential that validates end-to-end Generative AI engineering competence across design, build, and operate.",
    duration: "Self-paced exam window",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Earn the HIGAET Certified Generative AI Engineer credential.",
      "Demonstrate competence across architecture, evaluation, and operations.",
      "Receive a verifiable digital badge accepted by HIGAET hiring partners.",
    ],
    metadata: {
      title: "Certified Generative AI Engineer | HIGAET Academy",
      description:
        "HIGAET's flagship Generative AI engineering certification — proctored, verifiable, and recognized across HIGAET hiring partners worldwide.",
      keywords: [
        "generative ai certification",
        "ai engineer certification",
        "higaet certified",
        "llm engineer credential",
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
    id: "academy_course_cert_prompt_engineering",
    slug: "certified-prompt-engineering-professional",
    status: "published",
    visibility: "public",
    categoryId: CAT_CERTIFICATIONS,
    title: "Certified Prompt Engineering Professional",
    summary:
      "Validate practical mastery of prompt design, structured outputs, evaluation, and prompt operations across modern frontier models.",
    duration: "Self-paced exam window",
    level: "beginner",
    mode: "online",
    outcomes: [
      "Demonstrate disciplined prompt design across model families.",
      "Build evaluation harnesses for prompt quality and regression.",
      "Earn a verifiable HIGAET prompt engineering credential.",
    ],
    metadata: {
      title: "Certified Prompt Engineering Professional | HIGAET Academy",
      description:
        "HIGAET certification for prompt engineering professionals — covers prompt design, structured outputs, evaluation, and prompt operations.",
      keywords: [
        "prompt engineering certification",
        "prompt engineer credential",
        "higaet certification",
        "ai prompt course",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },

  // ============================================================
  // Bootcamps
  // ============================================================
  {
    id: "academy_course_bootcamp_ai_engineer",
    slug: "ai-engineer-bootcamp",
    status: "published",
    visibility: "public",
    categoryId: CAT_BOOTCAMPS,
    title: "AI Engineer Bootcamp",
    summary:
      "A 16-week cohort that takes working engineers from competent coders to job-ready Generative AI engineers.",
    duration: "16 weeks",
    level: "intermediate",
    mode: "hybrid",
    outcomes: [
      "Ship four portfolio-grade Generative AI projects with HIGAET mentorship.",
      "Build a hiring-ready GitHub, resume, and interview narrative.",
      "Access HIGAET's global partner hiring network upon completion.",
    ],
    curriculum: [
      "Phase 1 — Foundations and tooling (weeks 1–4)",
      "Phase 2 — Applied LLM systems (weeks 5–8)",
      "Phase 3 — Retrieval, agents, and evaluation (weeks 9–12)",
      "Phase 4 — Capstone, interviews, and placement (weeks 13–16)",
    ],
    faqs: [
      {
        question: "Is this full-time?",
        answer:
          "No. The bootcamp is designed for working professionals — expect 12–15 focused hours per week plus live weekend sessions.",
      },
    ],
    metadata: {
      title: "AI Engineer Bootcamp | HIGAET Academy",
      description:
        "A 16-week mentor-led AI Engineer bootcamp for working professionals — four real projects, career coaching, and access to HIGAET's hiring network.",
      keywords: [
        "ai engineer bootcamp",
        "generative ai bootcamp",
        "ai career bootcamp",
        "higaet bootcamp",
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
    id: "academy_course_bootcamp_llmops",
    slug: "llmops-bootcamp",
    status: "published",
    visibility: "public",
    categoryId: CAT_BOOTCAMPS,
    title: "LLMOps Bootcamp",
    summary:
      "A focused 8-week bootcamp on operating LLM workloads — observability, evaluation, cost, safety, and incident response.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    outcomes: [
      "Stand up an end-to-end LLMOps stack with tracing, evals, and budgets.",
      "Run an incident response drill on a degraded LLM system.",
      "Translate model behavior into operational SLOs your business can trust.",
    ],
    metadata: {
      title: "LLMOps Bootcamp | HIGAET Academy",
      description:
        "An 8-week LLMOps bootcamp — observability, evaluation, cost control, safety, and incident response for production LLM systems.",
      keywords: [
        "llmops",
        "llm operations",
        "ai observability",
        "higaet bootcamp",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },

  // ============================================================
  // Executive Programs
  // ============================================================
  {
    id: "academy_course_exec_ai_strategy",
    slug: "ai-strategy-for-leaders",
    status: "published",
    visibility: "public",
    categoryId: CAT_EXECUTIVE,
    title: "AI Strategy for Leaders",
    summary:
      "A 6-week executive program on diagnosing AI opportunities, structuring portfolios, and governing responsible adoption.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "hybrid",
    outcomes: [
      "Build an AI opportunity portfolio mapped to business outcomes.",
      "Design an AI governance model appropriate to your sector.",
      "Lead AI investment conversations with confidence and rigor.",
    ],
    metadata: {
      title: "AI Strategy for Leaders | HIGAET Academy",
      description:
        "An executive program for leaders driving Generative AI strategy — opportunity diagnosis, portfolio design, and governance for responsible adoption.",
      keywords: [
        "ai strategy",
        "executive ai program",
        "ai for leaders",
        "ai governance",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },

  // ============================================================
  // Workshops
  // ============================================================
  {
    id: "academy_course_workshop_evals",
    slug: "llm-evaluation-workshop",
    status: "published",
    visibility: "public",
    categoryId: CAT_WORKSHOPS,
    title: "LLM Evaluation Workshop",
    summary:
      "A two-day intensive on building eval datasets, golden sets, and regression pipelines that prevent silent LLM degradation.",
    duration: "2 days",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Author a golden-set evaluation suite for your own LLM workflow.",
      "Wire CI to fail builds on regressions in groundedness and quality.",
    ],
    metadata: {
      title: "LLM Evaluation Workshop | HIGAET Academy",
      description:
        "A two-day hands-on workshop on building reliable LLM evaluation suites, golden sets, and CI-integrated regression pipelines.",
      keywords: [
        "llm evaluation",
        "ai evals",
        "llm testing",
        "higaet workshop",
      ],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },

  // ============================================================
  // Enterprise Training
  // ============================================================
  {
    id: "academy_course_enterprise_ai_literacy",
    slug: "enterprise-ai-literacy-program",
    status: "published",
    visibility: "public",
    categoryId: CAT_ENTERPRISE,
    title: "Enterprise AI Literacy Program",
    summary:
      "A configurable, organization-wide program that establishes shared AI vocabulary, responsible-use norms, and applied skills across functions.",
    duration: "4–8 weeks (configurable)",
    level: "beginner",
    mode: "hybrid",
    outcomes: [
      "Establish a shared AI vocabulary across business and technical teams.",
      "Equip every function with role-specific applied AI workflows.",
      "Roll out responsible-use guidelines aligned to your governance model.",
    ],
    metadata: {
      title: "Enterprise AI Literacy Program | HIGAET Academy",
      description:
        "Organization-wide AI literacy and applied skills program — configurable by role, function, and governance posture. Delivered globally by HIGAET.",
      keywords: [
        "enterprise ai literacy",
        "corporate ai training",
        "ai upskilling",
        "higaet enterprise",
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
 * Frozen list of all course IDs in the Academy registry.
 * Derived from `ACADEMY_COURSES`; exported for cross-registry
 * reference validation (e.g. learning path `courseIds`).
 */
export const ACADEMY_COURSE_IDS: readonly string[] = ACADEMY_COURSES.map(
  (c) => c.id,
);
