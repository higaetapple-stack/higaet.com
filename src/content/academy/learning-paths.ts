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
const C_MCP = "academy_course_mcp_engineering";
const C_EVALS = "academy_course_ai_evals_engineering";
const C_KG = "academy_course_knowledge_graphs_vectors";
const C_DATA_ENG = "academy_course_data_engineering_ai";
const C_MLOPS = "academy_course_mlops_pipeline";
const C_CLAUDE = "academy_course_claude_code_engineering";
const C_SYS = "academy_course_system_design_ai_era";
const C_CLOUD_SEC = "academy_course_cloud_security_devsecops";
const C_AI_SEC = "academy_course_ai_security_governance";
const C_FULLSTACK = "academy_course_fullstack_nextjs";
const C_GOV = "academy_course_ai_governance_responsible";
const C_SW_ENG = "academy_course_software_engineering";
const C_GENAI_ENG = "academy_course_genai_engineering";
const C_LLM_ENG = "academy_course_llm_engineering";
const C_RAG_APP = "academy_course_rag_application_engineering";
const C_AGENTIC = "academy_course_agentic_ai_engineering";
const C_AI_SYSTEMS = "academy_course_ai_systems_engineering";
const C_CLOUD_ENG = "academy_course_cloud_engineering";
const C_DEVOPS = "academy_course_devops_engineering";
const C_K8S = "academy_course_kubernetes_engineering";
const C_PLATFORM = "academy_course_platform_engineering";
const C_SRE = "academy_course_sre";
const C_ANALYTICS = "academy_course_data_analytics";
const C_DS = "academy_course_data_science";
const C_DE = "academy_course_data_engineering";
const C_ML = "academy_course_machine_learning";
const C_MLOPS_NEW = "academy_course_mlops";
const C_CYBER = "academy_course_cybersecurity_engineering";
const C_APPSEC = "academy_course_application_security";
const C_CLOUDSEC = "academy_course_cloud_security";
const C_SOC = "academy_course_soc_engineering";
const C_SECARCH = "academy_course_security_architecture";

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
    courseIds: [C_GENAI_FOUNDATIONS, C_CERT_PROMPT, C_RAG_SYSTEMS, C_APPLIED_LLM],
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
    courseIds: [C_GENAI_FOUNDATIONS, C_APPLIED_LLM, C_WORKSHOP_EVALS, C_BOOTCAMP_LLMOPS],
    metadata: {
      title: "LLMOps Specialist Path | HIGAET Academy",
      description:
        "HIGAET Academy's LLMOps Specialist path — evaluation, observability, cost control, safety, and incident response for production LLM workloads.",
      keywords: ["llmops path", "llm operations career", "ai sre", "higaet learning path"],
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
    courseIds: [C_GENAI_FOUNDATIONS, C_EXEC_AI_STRATEGY],
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
  {
    id: "academy_path_agentic_systems",
    slug: "agentic-systems-and-mcp",
    status: "published",
    visibility: "public",
    title: "Agentic Systems & MCP",
    summary:
      "From tool-using agents to multi-agent workforces — MCP servers, orchestration, trajectory evals, and production reliability.",
    audience: "AI engineers building agentic automations and workforces",
    duration: "~8 months",
    courseIds: [
      C_GENAI_FOUNDATIONS,
      C_APPLIED_LLM,
      C_MCP,
      C_EVALS,
      C_KG,
      C_CLAUDE,
      C_BOOTCAMP_AI_ENGINEER,
    ],
    metadata: {
      title: "Agentic Systems & MCP Path | HIGAET Academy",
      description:
        "HIGAET Academy agentic systems path — MCP servers, multi-agent orchestration, AI evals, knowledge graphs, and agentic coding at scale.",
      keywords: [
        "agentic ai path",
        "mcp course path",
        "multi agent systems",
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
    id: "academy_path_data_platform",
    slug: "data-engineering-and-mlops",
    status: "published",
    visibility: "public",
    title: "Data Engineering & MLOps",
    summary:
      "The complete data-to-model platform: pipelines, lakes, feature stores, and model operations that survive reorgs and audits.",
    audience: "Data engineers, ML engineers, and platform teams",
    duration: "~7 months",
    courseIds: [C_GENAI_FOUNDATIONS, C_DATA_ENG, C_MLOPS, C_SYS],
    metadata: {
      title: "Data Engineering & MLOps Path | HIGAET Academy",
      description:
        "HIGAET Academy data platform path — data engineering for AI, MLOps pipelines, system design for AI-scale workloads.",
      keywords: [
        "data engineering path",
        "mlops path",
        "feature store course",
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
    id: "academy_path_platform_cloud_security",
    slug: "platform-cloud-and-ai-security",
    status: "published",
    visibility: "public",
    title: "Platform, Cloud & AI Security",
    summary:
      "Defend the modern stack: hardened cloud platforms, DevSecOps pipelines, and AI-aware security from prompt to production.",
    audience: "Platform, SRE, and security engineers",
    duration: "~7 months",
    courseIds: [C_GENAI_FOUNDATIONS, C_CLOUD_SEC, C_AI_SEC, C_GOV, C_BOOTCAMP_LLMOPS],
    metadata: {
      title: "Platform, Cloud & AI Security Path | HIGAET Academy",
      description:
        "HIGAET Academy security path — cloud security, DevSecOps, AI security and governance for the modern AI stack.",
      keywords: ["cloud security path", "ai security", "devsecops course", "higaet learning path"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_path_fullstack_ai",
    slug: "full-stack-ai-engineering",
    status: "published",
    visibility: "public",
    title: "Full-Stack AI Engineering",
    summary:
      "Ship the full product: typed full-stack apps on Next.js with RAG, structured outputs, and agentic features built in.",
    audience: "Full-stack engineers shipping LLM-powered products",
    duration: "~6 months",
    courseIds: [C_GENAI_FOUNDATIONS, C_SYS, C_FULLSTACK, C_RAG_SYSTEMS],
    metadata: {
      title: "Full-Stack AI Engineering Path | HIGAET Academy",
      description:
        "HIGAET Academy full-stack AI path — Next.js, system design, retrieval, and shipping LLM features end-to-end.",
      keywords: [
        "full stack ai path",
        "nextjs ai engineering",
        "llm application developer",
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
    id: "academy_path_ai_engineering_track",
    slug: "ai-engineering-track",
    status: "published",
    visibility: "public",
    title: "AI Engineering Track",
    summary:
      "The canonical HIGAET journey into production AI: programming foundations, Generative AI, LLMs, RAG, agents, and AI systems engineering.",
    audience: "Engineers pursuing an AI engineering role",
    duration: "~8 months",
    courseIds: [C_SW_ENG, C_GENAI_ENG, C_LLM_ENG, C_RAG_APP, C_AGENTIC, C_AI_SYSTEMS],
    metadata: {
      title: "AI Engineering Track | HIGAET Academy",
      description:
        "HIGAET Academy AI Engineering Track — software foundations to Generative AI, LLMs, RAG, agents, and production AI systems.",
      keywords: [
        "ai engineering track",
        "ai engineer roadmap",
        "llm to agents path",
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
    id: "academy_path_cloud_platform_track",
    slug: "cloud-platform-engineering-track",
    status: "published",
    visibility: "public",
    title: "Cloud & Platform Engineering Track",
    summary:
      "From cloud fundamentals to owning platforms: DevOps delivery, Kubernetes operations, internal platforms, and reliability engineering.",
    audience: "Engineers pursuing cloud, platform, or SRE roles",
    duration: "~7 months",
    courseIds: [C_CLOUD_ENG, C_DEVOPS, C_K8S, C_PLATFORM, C_SRE],
    metadata: {
      title: "Cloud & Platform Track | HIGAET Academy",
      description:
        "HIGAET Academy Cloud and Platform Track — cloud, DevOps, Kubernetes, platform engineering, and site reliability.",
      keywords: [
        "cloud engineer path",
        "platform engineering track",
        "sre roadmap",
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
    id: "academy_path_data_ml_track",
    slug: "data-machine-learning-track",
    status: "published",
    visibility: "public",
    title: "Data & Machine Learning Track",
    summary:
      "From dashboards to deployed models: analytics, data science, data engineering, machine learning, and MLOps.",
    audience: "Analysts and engineers pursuing data or ML roles",
    duration: "~8 months",
    courseIds: [C_ANALYTICS, C_DS, C_DE, C_ML, C_MLOPS_NEW],
    metadata: {
      title: "Data & Machine Learning Track | HIGAET Academy",
      description:
        "HIGAET Academy Data and ML Track — analytics, data science, data engineering, machine learning, and MLOps.",
      keywords: [
        "data science path",
        "ml engineer roadmap",
        "data to ml track",
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
    id: "academy_path_cybersecurity_track",
    slug: "cybersecurity-track",
    status: "published",
    visibility: "public",
    title: "Cybersecurity Track",
    summary:
      "From defensive foundations to architecture: application and cloud security, SOC operations, and security architecture.",
    audience: "IT staff and engineers pursuing security roles",
    duration: "~7 months",
    courseIds: [C_CYBER, C_APPSEC, C_CLOUDSEC, C_SOC, C_SECARCH],
    metadata: {
      title: "Cybersecurity Track | HIGAET Academy",
      description:
        "HIGAET Academy Cybersecurity Track — security engineering, app and cloud security, SOC operations, and architecture.",
      keywords: [
        "cybersecurity path",
        "security engineer roadmap",
        "soc analyst track",
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
export const ACADEMY_LEARNING_PATH_IDS: readonly string[] = ACADEMY_LEARNING_PATHS.map((p) => p.id);
