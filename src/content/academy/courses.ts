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
      keywords: ["generative ai course", "llm course", "rag course", "ai foundations"],
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
      keywords: ["llm engineering course", "production llm", "llm observability", "llm evaluation"],
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
      keywords: ["llmops", "llm operations", "ai observability", "higaet bootcamp"],
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
      keywords: ["ai strategy", "executive ai program", "ai for leaders", "ai governance"],
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
      keywords: ["llm evaluation", "ai evals", "llm testing", "higaet workshop"],
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
  // ============================================================
  // New: MCP, Data, Platform, Security, Systems (2026-09-08)
  // ============================================================
  {
    id: "academy_course_mcp_engineering",
    slug: "mcp-engineering",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "MCP Engineering — Building Tool-Using Systems",
    summary:
      "Turn LLMs into tool-using systems that call your APIs, MCP servers, and internal tools reliably — with auth, retries, and evaluation baked in.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Design MCP servers and function-calling contracts that survive real traffic.",
      "Orchestrate multi-tool workflows with state, retries, and human-in-the-loop.",
      "Evaluate tool-use quality with groundedness and trajectory metrics.",
      "Ship an MCP-powered feature to production with observability and cost controls.",
    ],
    curriculum: [
      "Week 1 — Tool use as an engineering discipline",
      "Week 2 — MCP servers: contracts, auth, and discovery",
      "Week 3 — Multi-tool planning and recovery",
      "Week 4 — Long-running workflows and human-in-the-loop",
      "Week 5 — Evaluation of tool-use and trajectory quality",
      "Week 6 — Capstone: a production MCP feature",
    ],
    faqs: [
      {
        question: "How is this different from the AI Agents program?",
        answer:
          "AI Agents goes wide on planning, multi-agent patterns, and operations. MCP Engineering goes deep on tool-use as a first-class engineering surface — server contracts, idempotency, and eval.",
      },
    ],
    metadata: {
      title: "MCP Engineering Course | HIGAET Academy",
      description:
        "Build reliable tool-using systems with Model Context Protocol — MCP servers, multi-tool orchestration, evaluation, and production operations.",
      keywords: [
        "mcp engineering",
        "model context protocol",
        "tool use course",
        "function calling course",
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
    id: "academy_course_ai_evals_engineering",
    slug: "ai-evals-engineering",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "AI Evals Engineering — Reliable LLM Quality",
    summary:
      "Build evaluation suites, golden sets, and CI pipelines that stop silent LLM degradation before users notice.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Author golden sets and eval harnesses for retrieval, generation, and tool-use.",
      "Run offline, online, and human-in-the-loop evaluations with clear SLOs.",
      "Wire CI to fail builds on regressions in groundedness and usefulness.",
      "Present eval results as a product-quality narrative to stakeholders.",
    ],
    curriculum: [
      "Week 1 — What to evaluate and why",
      "Week 2 — Golden sets and dataset craft",
      "Week 3 — Offline evals: automated judges and metrics",
      "Week 4 — Online evals: sampling, labeling, and feedback loops",
      "Week 5 — Regression testing in CI",
      "Week 6 — Capstone: an end-to-end eval suite",
    ],
    metadata: {
      title: "AI Evals Engineering Course | HIGAET Academy",
      description:
        "Hands-on course on LLM evaluation — golden sets, automated judges, human-in-the-loop, regression testing, and CI-integrated eval operations.",
      keywords: ["ai evals course", "llm evaluation", "ai testing course", "golden set evaluation"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_course_knowledge_graphs_vectors",
    slug: "knowledge-graphs-and-vector-systems",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "Knowledge Graphs & Vector Systems",
    summary:
      "Build retrieval systems that combine knowledge graphs, vector search, and hybrid ranking for entity-grounded AI.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Model entities, relations, and constraints for graph-grounded retrieval.",
      "Operate vector stores with chunking, embeddings, and freshness controls.",
      "Fuse graph and vector signals with hybrid search and re-ranking.",
      "Ship an entity-grounded retrieval system with measurable accuracy gains.",
    ],
    curriculum: [
      "Week 1 — Retrieval beyond vectors: when graphs help",
      "Week 2 — Knowledge graph modeling and ingestion",
      "Week 3 — Vector indexes and hybrid search",
      "Week 4 — Entity resolution and grounding",
      "Week 5 — Evaluating graph-augmented retrieval",
      "Week 6 — Capstone: a grounded retrieval system",
    ],
    metadata: {
      title: "Knowledge Graphs & Vector Systems Course | HIGAET Academy",
      description:
        "Build grounded retrieval systems with knowledge graphs, embeddings, hybrid search, re-ranking, and production vector operations.",
      keywords: [
        "knowledge graph course",
        "vector database course",
        "hybrid search course",
        "ai search course",
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
    id: "academy_course_data_engineering_ai",
    slug: "data-engineering-for-ai",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "Data Engineering for AI",
    summary:
      "Design data pipelines, lakes, and streaming systems that make machine learning and generative AI actually work in production.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Design batch and streaming pipelines for AI workloads.",
      "Implement data quality, governance, and lineage that survives reorgs.",
      "Build feature stores and data contracts for model and retrieval teams.",
      "Ship a production pipeline reviewed against operational rubrics.",
    ],
    curriculum: [
      "Week 1 — Data architecture for AI teams",
      "Week 2 — Pipelines: batch, streaming, and contracts",
      "Week 3 — Lakes, warehouses, and lakehouses",
      "Week 4 — Data quality and observability",
      "Week 5 — Feature stores and serving",
      "Week 6 — Governance, lineage, and cost",
      "Week 7 — Performance and scale",
      "Week 8 — Capstone: a production-grade pipeline",
    ],
    metadata: {
      title: "Data Engineering for AI Course | HIGAET Academy",
      description:
        "Hands-on data engineering for AI — pipelines, lakes, streaming, feature stores, data quality, governance, and production operations.",
      keywords: [
        "data engineering course",
        "ai data pipeline",
        "feature store course",
        "higaet academy",
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
    id: "academy_course_mlops_pipeline",
    slug: "mlops-pipeline-engineering",
    status: "published",
    visibility: "public",
    categoryId: CAT_BOOTCAMPS,
    title: "MLOps Pipeline Engineering",
    summary:
      "Operate the full ML lifecycle — from experiment to deployed model — with pipelines, registries, and drift-aware monitoring.",
    duration: "8 weeks",
    level: "advanced",
    mode: "hybrid",
    outcomes: [
      "Stand up a pipeline with experiment tracking, model registry, and approval gates.",
      "Automate data, training, and evaluation with reproducible DAGs.",
      "Monitor deployed models for drift, skew, and business impact.",
      "Run an incident drill on a degraded model in production.",
    ],
    curriculum: [
      "Module 1 — ML lifecycle as a pipeline",
      "Module 2 — Feature and data validation",
      "Module 3 — Training pipelines and registries",
      "Module 4 — Deployment patterns and canaries",
      "Module 5 — Monitoring, drift, and rollback",
      "Module 6 — Capstone and operational review",
    ],
    metadata: {
      title: "MLOps Pipeline Engineering | HIGAET Academy",
      description:
        "Build and operate MLOps pipelines — experiment tracking, model registries, automated training, deployment, and drift-aware monitoring.",
      keywords: ["mlops course", "ml pipeline course", "model registry course", "higaet bootcamp"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_course_claude_code_engineering",
    slug: "ai-native-software-engineering-with-claude-code",
    status: "published",
    visibility: "public",
    categoryId: CAT_WORKSHOPS,
    title: "AI-native Software Engineering with Claude Code",
    summary:
      "Treat Claude Code as an engineering teammate — verification loops, codebase-aware workflows, and agentic coding at scale.",
    duration: "3 days",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Run verification-loop workflows that keep agentic code honest.",
      "Operate Claude Code across a real codebase with reviewable artifacts.",
      "Build codebase literacy checks that catch silent regressions.",
    ],
    curriculum: [
      "Day 1 — Agentic coding: when loops hold and when they don't",
      "Day 2 — Codebase-aware workflows and review",
      "Day 3 — Capstone: an agentic coding delivery",
    ],
    metadata: {
      title: "AI-native Software Engineering with Claude Code | HIGAET Academy",
      description:
        "Hands-on workshop on agentic coding with Claude Code — verification loops, codebase-aware workflows, and code review at scale.",
      keywords: [
        "claude code course",
        "agentic coding",
        "ai native engineering",
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
  {
    id: "academy_course_system_design_ai_era",
    slug: "system-design-for-the-ai-era",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "System Design for the AI Era",
    summary:
      "Design distributed systems that gracefully carry LLM, retrieval, and agentic workloads — and survive the interviews.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    outcomes: [
      "Decompose requirements into scalable system architectures.",
      "Design for the AI-specific concerns: latency, cost, eval, and failure modes.",
      "Communicate trade-offs clearly in a system design interview.",
      "Produce a design document ready for an engineering review.",
    ],
    curriculum: [
      "Week 1 — Decomposition and constraints",
      "Week 2 — Storage, queues, and consistency",
      "Week 3 — API and streaming contracts",
      "Week 4 — Scaling patterns: sharding, caching, and backpressure",
      "Week 5 — AI in the path: inference, retrieval, and agents",
      "Week 6 — Cost, latency, and SLO design",
      "Week 7 — Failure modes and operability",
      "Week 8 — Mock reviews and design critiques",
    ],
    metadata: {
      title: "System Design for the AI Era | HIGAET Academy",
      description:
        "System design course for the AI era — distributed systems, API contracts, scaling patterns, and designing for inference, retrieval, and agents.",
      keywords: [
        "system design course",
        "software architecture course",
        "ai system design",
        "higaet academy",
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
    id: "academy_course_cloud_security_devsecops",
    slug: "cloud-security-and-devsecops",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "Cloud Security & DevSecOps Engineering",
    summary:
      "Shift security left: harden cloud workloads, pipelines, and containers with controls that ship alongside production code.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Harden cloud control planes, network perimeters, and IAM with least privilege.",
      "Embed security into CI/CD with policy-as-code and supply-chain controls.",
      "Operate container and Kubernetes workloads with runtime guardrails.",
      "Run a cloud incident simulation with evidence-grade postmortem.",
    ],
    curriculum: [
      "Week 1 — Cloud threat models and shared responsibility",
      "Week 2 — Identity, perimeters, and network security",
      "Week 3 — Pipeline security and supply chain",
      "Week 4 — Container and Kubernetes hardening",
      "Week 5 — Detection, logging, and response in the cloud",
      "Week 6 — DevSecOps as a team practice",
      "Week 7 — Incident simulation",
      "Week 8 — Capstone: a hardened cloud deployment",
    ],
    metadata: {
      title: "Cloud Security & DevSecOps Course | HIGAET Academy",
      description:
        "Hands-on cloud security and DevSecOps engineering — IAM, network perimeters, pipeline security, container hardening, and incident response.",
      keywords: [
        "cloud security course",
        "devsecops course",
        "container security course",
        "higaet academy",
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
    id: "academy_course_ai_security_governance",
    slug: "ai-security-and-governance",
    status: "published",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "AI Security & Governance",
    summary:
      "Secure generative AI systems end-to-end — prompt injection, data exfiltration, model risk, and governance that holds in audits.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Map AI-specific attack surfaces: prompt injection, extraction, and abuse.",
      "Design governance controls mapped to regulation and enterprise policy.",
      "Implement red-team evaluations and continuous safety monitoring.",
      "Produce a governance artifact that survives stakeholder and audit review.",
    ],
    curriculum: [
      "Week 1 — AI threat landscape and governance frames",
      "Week 2 — Prompt injection, jailbreaks, and extraction",
      "Week 3 — Data controls: PII, exfiltration, and provenance",
      "Week 4 — Red-teaming and evaluation",
      "Week 5 — Policy, audit, and reporting",
      "Week 6 — Capstone: a secured AI system with governance packet",
    ],
    metadata: {
      title: "AI Security & Governance Course | HIGAET Academy",
      description:
        "Secure and govern Generative AI systems — threat modeling, prompt injection defense, red-teaming, and governance that holds in audits.",
      keywords: [
        "ai security course",
        "ai governance course",
        "prompt injection defense",
        "higaet academy",
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
    id: "academy_course_data_analytics_fundamentals",
    slug: "data-analytics-fundamentals",
    status: "comingSoon",
    visibility: "public",
    categoryId: CAT_ONLINE_COURSES,
    title: "Data Analytics Fundamentals with SQL, Python & Power BI",
    summary:
      "A rigorous, tool-grounded entry point into analytics — SQL you can explain, Python you can reuse, and dashboards decision-makers actually use.",
    duration: "6 weeks",
    level: "beginner",
    mode: "online",
    outcomes: [
      "Query real datasets with readable, performant SQL.",
      "Clean, transform, and visualize data in Python.",
      "Build decision-grade dashboards in Power BI with sound data modeling.",
      "Tell the data story clearly to non-technical stakeholders.",
    ],
    curriculum: [
      "Week 1 — Analytics thinking and data shapes",
      "Week 2 — SQL deep enough to explain",
      "Week 3 — Python for analysis (Pandas, plotting)",
      "Week 4 — Power BI: modeling and DAX",
      "Week 5 — Visualization and storytelling",
      "Week 6 — Capstone: an analytics portfolio piece",
    ],
    metadata: {
      title: "Data Analytics Fundamentals | HIGAET Academy",
      description:
        "A 6-week data analytics fundamentals course — SQL, Python, Power BI dashboards, visualization, and decision-grade storytelling.",
      keywords: ["data analytics course", "sql course", "power bi course", "higaet academy"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_course_fullstack_nextjs",
    slug: "full-stack-engineering-with-nextjs",
    status: "published",
    visibility: "public",
    categoryId: CAT_BOOTCAMPS,
    title: "Full-Stack Engineering with Next.js & AI Features",
    summary:
      "Ship a production full-stack app on Next.js, TypeScript, and modern edge infrastructure — with LLM features integrated the way real product teams do it.",
    duration: "10 weeks",
    level: "intermediate",
    mode: "hybrid",
    outcomes: [
      "Build a typed, tested full-stack app with auth, payments, and observability.",
      "Integrate LLM features (RAG, structured outputs, agents) production-grade.",
      "Operate on modern edge/serverless platforms with CI and rollbacks.",
      "Ship a portfolio app ready for hiring conversations.",
    ],
    curriculum: [
      "Weeks 1–2 — Next.js, TypeScript, and data layer",
      "Weeks 3–4 — Auth, payments, and access control",
      "Weeks 5–6 — Background jobs, queues, and observability",
      "Weeks 7–8 — LLM features: RAG and structured outputs",
      "Weeks 9–10 — Capstone: ship to production",
    ],
    metadata: {
      title: "Full-Stack Engineering with Next.js | HIGAET Academy",
      description:
        "A 10-week full-stack engineering bootcamp — Next.js, TypeScript, auth, payments, and LLM features shipped to production on modern edge platforms.",
      keywords: ["full stack course", "nextjs course", "full stack engineering", "higaet bootcamp"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_course_ai_governance_responsible",
    slug: "ai-governance-and-responsible-deployment",
    status: "published",
    visibility: "public",
    categoryId: CAT_EXECUTIVE,
    title: "AI Governance & Responsible Deployment",
    summary:
      "Operationalize responsible AI: map risks to controls, embed governance into the delivery lifecycle, and report credibly to stakeholders.",
    duration: "4 weeks",
    level: "intermediate",
    mode: "online",
    outcomes: [
      "Map AI risks to concrete governance controls for your sector.",
      "Embed governance gates into the ML/GenAI delivery lifecycle.",
      "Report AI risk posture clearly to boards, regulators, and customers.",
    ],
    curriculum: [
      "Week 1 — Responsible AI frames and obligations",
      "Week 2 — Risk mapping and control design",
      "Week 3 — Governance in the lifecycle: gates and reviews",
      "Week 4 — Reporting and assurance: a governance packet",
    ],
    metadata: {
      title: "AI Governance & Responsible Deployment | HIGAET Academy",
      description:
        "Operationalize responsible AI governance — risk mapping, control design, lifecycle gates, and reporting for boards and regulators.",
      keywords: [
        "ai governance course",
        "responsible ai course",
        "ai risk management",
        "higaet academy",
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
export const ACADEMY_COURSE_IDS: readonly string[] = ACADEMY_COURSES.map((c) => c.id);
