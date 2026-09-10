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
const CAT_AI_GENERATIVE = "academy_category_ai_generative_ai";
const CAT_SOFTWARE = "academy_category_software_engineering";
const CAT_CLOUD = "academy_category_cloud_infrastructure";
const CAT_DATA_ML = "academy_category_data_ml";
const CAT_CYBER = "academy_category_cybersecurity";
const CAT_EMERGING = "academy_category_emerging_tech";
const CAT_LEADERSHIP = "academy_category_engineering_leadership";

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
    audience: [
      "Students",
      "Career changers",
      "Software developers",
      "Data analysts",
      "Product managers",
      "Operations staff",
    ],
    prerequisites: [
      "No previous AI experience required",
      "Basic computer literacy and web tools",
      "Willingness to complete weekly hands-on exercises",
    ],
    technologies: [
      "Generative AI models",
      "Large language models",
      "Prompt templates",
      "AI chat tools",
      "Embedding models",
      "Vector databases",
      "Python notebooks",
    ],
    projects: [
      "Text generation playground",
      "Summarization assistant",
      "Prompt library collection",
      "Knowledge Q&A prototype",
      "Capstone: Generative AI foundations portfolio",
    ],
    skills: [
      "Generative AI concepts",
      "Prompt design",
      "Text summarization",
      "AI use-case mapping",
      "Responsible AI basics",
      "Prototype building",
    ],
    hoursPerWeek: "6-8 hours/week",
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
      {
        question: "What will I build?",
        answer:
          "You will build a prompt library, a summarization workflow, and a capstone retrieval-grounded mini-app with evaluation notes.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as AI application developer, prompt engineer, chatbot developer, business analyst, and associate solutions engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
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
    audience: [
      "Software developers",
      "Backend developers",
      "AI engineers",
      "ML engineers",
      "Data engineers",
      "Career changers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Familiarity with prompt experiments",
      "Basic knowledge of cloud services",
    ],
    technologies: [
      "Large language models",
      "Orchestration frameworks",
      "Evaluation harnesses",
      "Observability tools",
      "Retrieval pipelines",
      "API gateways",
      "Cost dashboards",
      "CI pipelines",
    ],
    projects: [
      "Orchestrated LLM application",
      "Retrieval-augmented assistant",
      "Offline evaluation pipeline",
      "Observable LLM service",
      "Capstone: Production LLM system with evals and cost controls",
    ],
    skills: [
      "LLM orchestration",
      "Retrieval integration",
      "Evaluation pipelines",
      "Observability setup",
      "Cost control",
      "Production deployment",
    ],
    hoursPerWeek: "6-8 hours/week",
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
    faqs: [
      {
        question: "Who should take Applied LLM Engineering and what are the prerequisites?",
        answer:
          "This course is for software developers, ML practitioners, and backend engineers who want to build production LLM features. Prerequisites include working Python skills, basic API and Git familiarity, and comfort with JSON and command-line workflows.",
      },
      {
        question: "What will I build in Applied LLM Engineering?",
        answer:
          "You will build a structured-output chatbot with tool calling, a document Q and A assistant with guardrails, and a capstone LLM microservice with logging, retries, and deployment-ready API endpoints.",
      },
      {
        question: "What careers or roles does Applied LLM Engineering support?",
        answer:
          "Relevant roles include LLM Engineer, Applied AI Engineer, Backend Engineer for AI Features, AI Application Developer, Solutions Engineer, Platform Engineer, and Product Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Software developers",
      "Backend developers",
      "AI engineers",
      "Data engineers",
      "Data scientists",
      "ML engineers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Basic understanding of large language models",
      "Familiarity with databases and APIs",
    ],
    technologies: [
      "Embedding models",
      "Vector databases",
      "Chunking tools",
      "Retrieval frameworks",
      "Reranking models",
      "Large language models",
      "Evaluation harnesses",
    ],
    projects: [
      "Document ingestion pipeline",
      "Semantic search service",
      "Grounded Q&A assistant",
      "Citation-aware RAG app",
      "Capstone: Production RAG system with evaluation",
    ],
    skills: [
      "Document chunking",
      "Embedding pipelines",
      "Vector retrieval",
      "Grounded generation",
      "Citation handling",
      "RAG evaluation",
    ],
    hoursPerWeek: "6-8 hours/week",
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
    faqs: [
      {
        question:
          "Who should take Retrieval-Augmented Generation Systems and what are the prerequisites?",
        answer:
          "This course is for developers, data engineers, and AI builders working with document search and grounded answers. Prerequisites include Python basics, familiarity with REST APIs, and basic understanding of embeddings and databases.",
      },
      {
        question: "What will I build in Retrieval-Augmented Generation Systems?",
        answer:
          "You will build a chunking and indexing pipeline over sample docs, a cited Q and A system with reranking, and a capstone RAG service with evaluation checks and source-grounded responses.",
      },
      {
        question: "What careers or roles does Retrieval-Augmented Generation Systems support?",
        answer:
          "Relevant roles include RAG Engineer, Search Engineer, Applied AI Engineer, Knowledge Systems Developer, Data Engineer, AI Solutions Engineer, and Support Automation Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Software developers",
      "AI engineers",
      "ML engineers",
      "Data engineers",
      "Career changers",
      "Cloud engineers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Experience building LLM prototypes",
      "Familiarity with deployment and monitoring basics",
    ],
    technologies: [
      "Large language models",
      "Prompt frameworks",
      "Retrieval pipelines",
      "Evaluation harnesses",
      "Deployment platforms",
      "Observability tools",
      "Version control",
      "API gateways",
    ],
    projects: [
      "Designed AI solution blueprint",
      "Built retrieval-grounded application",
      "Evaluation and safety test suite",
      "Operated deployment with monitoring",
      "Capstone: End-to-end Generative AI engineering assessment",
    ],
    skills: [
      "Solution design",
      "Application building",
      "Prompt operations",
      "Evaluation methods",
      "Deployment practices",
      "System monitoring",
      "Safety controls",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Earn the HIGAET Certified Generative AI Engineer credential.",
      "Demonstrate competence across architecture, evaluation, and operations.",
      "Receive a verifiable digital badge accepted by HIGAET hiring partners.",
    ],
    faqs: [
      {
        question:
          "Who should take Certified Generative AI Engineer and what are the prerequisites?",
        answer:
          "This course is for engineers and technical professionals preparing for applied generative AI engineering work. Prerequisites include intermediate Python, familiarity with APIs and cloud concepts, and basic machine learning vocabulary.",
      },
      {
        question: "What will I build in Certified Generative AI Engineer?",
        answer:
          "You will build a prompt-to-prototype application, a multimodal content workflow with image and text inputs, and a capstone generative AI project with testing, documentation, and a demo walkthrough.",
      },
      {
        question: "What careers or roles does Certified Generative AI Engineer support?",
        answer:
          "Relevant roles include Generative AI Engineer, AI Application Engineer, Prompt and Workflow Engineer, AI Prototyping Engineer, Solutions Architect, Forward Deployed Engineer, and Technical Consultant.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Students",
      "Career changers",
      "Software developers",
      "Product managers",
      "Data analysts",
      "Operations staff",
    ],
    prerequisites: [
      "No previous AI experience required",
      "Comfort with web applications and documents",
      "Willingness to practice structured exercises",
    ],
    technologies: [
      "Frontier language models",
      "Prompt templates",
      "Structured output schemas",
      "Evaluation harnesses",
      "Version control",
      "Model playgrounds",
      "Regression test suites",
    ],
    projects: [
      "Prompt pattern collection",
      "Structured output generator",
      "Multi-model comparison study",
      "Prompt regression suite",
      "Capstone: Prompt operations portfolio with evaluation harness",
    ],
    skills: [
      "Prompt design",
      "Structured outputs",
      "Output evaluation",
      "Regression testing",
      "Model comparison",
      "Prompt operations",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Demonstrate disciplined prompt design across model families.",
      "Build evaluation harnesses for prompt quality and regression.",
      "Earn a verifiable HIGAET prompt engineering credential.",
    ],
    faqs: [
      {
        question:
          "Who should take Certified Prompt Engineering Professional and what are the prerequisites?",
        answer:
          "This course is for writers, marketers, analysts, product staff, and developers who use LLMs daily. Prerequisites include basic computer skills, familiarity with a chat-based LLM tool, and comfort writing clear instructions.",
      },
      {
        question: "What will I build in Certified Prompt Engineering Professional?",
        answer:
          "You will build a reusable prompt library for drafting and summarization, a structured-output template set for reports and briefs, and a capstone prompt playbook with before-and-after examples for a real workflow.",
      },
      {
        question: "What careers or roles does Certified Prompt Engineering Professional support?",
        answer:
          "Relevant roles include Prompt Engineer, AI Content Specialist, Marketing Technologist, Business Analyst, Product Manager, Customer Operations Specialist, and Learning Designer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Software developers",
      "Backend developers",
      "Career changers",
      "Data engineers",
      "Cloud engineers",
      "AI engineers",
    ],
    prerequisites: [
      "Working proficiency in Python and Git",
      "Experience building web APIs",
      "Ability to commit to cohort schedule and reviews",
    ],
    technologies: [
      "Large language models",
      "Python",
      "Orchestration frameworks",
      "Vector databases",
      "Evaluation harnesses",
      "Deployment platforms",
      "Version control",
      "Portfolio tooling",
    ],
    projects: [
      "LLM application build",
      "Retrieval-grounded assistant",
      "Evaluated deployment project",
      "Open-source contribution project",
      "Capstone: Generative AI engineer portfolio with interview narrative",
    ],
    skills: [
      "Python application building",
      "LLM integration",
      "Retrieval systems",
      "Evaluation practices",
      "Deployment workflows",
      "Code review collaboration",
      "Technical communication",
    ],
    hoursPerWeek: "5-7 hours/week",
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
      {
        question: "Who should join the bootcamp?",
        answer:
          "Developers and career changers with working Python and Git skills who can commit to a cohort schedule with weekly reviews.",
      },
      {
        question: "What will I build?",
        answer:
          "You will build an LLM application, a retrieval-grounded assistant, an evaluated deployment, and a capstone portfolio project with an interview narrative.",
      },
      {
        question: "What careers does this bootcamp support?",
        answer:
          "It supports roles such as AI engineer, LLM application developer, applied AI engineer, and backend engineer for AI features.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
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
    audience: [
      "DevOps practitioners",
      "Platform engineers",
      "Cloud engineers",
      "Backend developers",
      "ML engineers",
      "AI engineers",
    ],
    prerequisites: [
      "Experience operating cloud services and APIs",
      "Familiarity with LLM applications",
      "Comfort with monitoring and incident workflows",
    ],
    technologies: [
      "Observability platforms",
      "Evaluation harnesses",
      "Cost dashboards",
      "Safety guardrails",
      "Incident runbooks",
      "CI pipelines",
      "Model gateways",
    ],
    projects: [
      "LLM observability setup",
      "Evaluation-gated release pipeline",
      "Cost control dashboard",
      "Safety incident response drill",
      "Capstone: Operated LLM workload with observability and incident plan",
    ],
    skills: [
      "LLM observability",
      "Evaluation gating",
      "Cost management",
      "Safety controls",
      "Incident response",
      "Release operations",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Stand up an end-to-end LLMOps stack with tracing, evals, and budgets.",
      "Run an incident response drill on a degraded LLM system.",
      "Translate model behavior into operational SLOs your business can trust.",
    ],
    faqs: [
      {
        question: "Who should take LLMOps Bootcamp and what are the prerequisites?",
        answer:
          "This course is for DevOps engineers, ML engineers, and backend developers responsible for shipping LLM systems. Prerequisites include Python and Git basics, familiarity with Docker and CI concepts, and comfort reading API logs.",
      },
      {
        question: "What will I build in LLMOps Bootcamp?",
        answer:
          "You will build a versioned prompt and model deployment pipeline, an observability setup with latency and quality traces, and a capstone LLMOps release workflow with rollback steps and cost tracking.",
      },
      {
        question: "What careers or roles does LLMOps Bootcamp support?",
        answer:
          "Relevant roles include LLMOps Engineer, MLOps Engineer, Platform Engineer, Site Reliability Engineer, AI Infrastructure Engineer, Release Engineer, and DevOps Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Technology leaders",
      "Engineering managers",
      "Product managers",
      "Entrepreneurs",
      "Operations staff",
      "Researchers",
    ],
    prerequisites: [
      "Experience managing teams or products",
      "Basic familiarity with AI capabilities",
      "No programming experience required",
    ],
    technologies: [
      "AI capability maps",
      "Use-case frameworks",
      "Risk registers",
      "Governance checklists",
      "ROI models",
      "Roadmap templates",
    ],
    projects: [
      "AI opportunity assessment",
      "Risk and governance map",
      "AI roadmap draft",
      "Capstone: AI strategy brief for leadership team",
    ],
    skills: [
      "AI opportunity mapping",
      "Risk assessment",
      "Governance planning",
      "Investment prioritization",
      "Roadmap development",
      "Stakeholder communication",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Build an AI opportunity portfolio mapped to business outcomes.",
      "Design an AI governance model appropriate to your sector.",
      "Lead AI investment conversations with confidence and rigor.",
    ],
    faqs: [
      {
        question: "Who should take AI Strategy for Leaders and what are the prerequisites?",
        answer:
          "This course is for managers, founders, directors, and non-technical leaders guiding AI adoption. Prerequisites include general business or product experience, with no coding required, plus familiarity with your team workflows.",
      },
      {
        question: "What will I build in AI Strategy for Leaders?",
        answer:
          "You will build an AI opportunity map for your organization, a pilot proposal with success metrics and risk notes, and a capstone AI roadmap with phased rollout steps and governance checkpoints.",
      },
      {
        question: "What careers or roles does AI Strategy for Leaders support?",
        answer:
          "Relevant roles include Product Manager, Program Manager, Operations Manager, Strategy Consultant, Innovation Lead, Department Head, Startup Founder, and Digital Transformation Lead.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Software developers",
      "AI engineers",
      "Data scientists",
      "ML engineers",
      "Product managers",
      "Quality engineers",
    ],
    prerequisites: [
      "Basic familiarity with large language models",
      "Comfort reading Python examples",
      "No previous evaluation experience required",
    ],
    technologies: [
      "Evaluation harnesses",
      "Golden datasets",
      "Scoring rubrics",
      "Regression suites",
      "Model playgrounds",
      "Results dashboards",
    ],
    projects: [
      "Golden set builder",
      "Scoring rubric exercise",
      "Regression test run",
      "Capstone: LLM evaluation mini-suite with findings report",
    ],
    skills: [
      "Golden set design",
      "Quality scoring",
      "Regression testing",
      "Error analysis",
      "Results reporting",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Author a golden-set evaluation suite for your own LLM workflow.",
      "Wire CI to fail builds on regressions in groundedness and quality.",
    ],
    faqs: [
      {
        question: "Who should take LLM Evaluation Workshop and what are the prerequisites?",
        answer:
          "This course is for builders and QA-minded practitioners who need to test LLM outputs. Prerequisites include basic Python or spreadsheet skills, familiarity with LLM chat tools, and comfort reviewing sample outputs against criteria.",
      },
      {
        question: "What will I build in LLM Evaluation Workshop?",
        answer:
          "You will build a rubric-based grading set for sample responses, an automated check suite with golden examples, and a capstone eval report comparing two prompt versions with error analysis.",
      },
      {
        question: "What careers or roles does LLM Evaluation Workshop support?",
        answer:
          "Relevant roles include AI QA Engineer, Evaluation Analyst, Prompt Engineer, Applied AI Engineer, Product Analyst, Trust and Safety Analyst, and Conversation Designer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Operations staff",
      "IT administrators",
      "Product managers",
      "Data analysts",
      "Students",
      "Engineering managers",
    ],
    prerequisites: [
      "No previous AI experience required",
      "Comfort with everyday office software",
      "Willingness to complete applied exercises",
    ],
    technologies: [
      "AI chat tools",
      "Prompt templates",
      "Data handling guides",
      "Safety checklists",
      "Use-case libraries",
      "Collaboration platforms",
    ],
    projects: [
      "Everyday prompting exercises",
      "Safe data-handling walkthrough",
      "Team use-case catalog",
      "Capstone: Responsible AI use plan for team",
    ],
    skills: [
      "AI fundamentals",
      "Effective prompting",
      "Safe data handling",
      "Use-case identification",
      "Responsible use practices",
      "Team adoption planning",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Establish a shared AI vocabulary across business and technical teams.",
      "Equip every function with role-specific applied AI workflows.",
      "Roll out responsible-use guidelines aligned to your governance model.",
    ],
    faqs: [
      {
        question: "Who should take Enterprise AI Literacy Program and what are the prerequisites?",
        answer:
          "This course is for employees, team leads, and cross-functional staff adopting AI responsibly at work. Prerequisites include basic workplace software skills, with no programming required, and willingness to practice with approved AI tools.",
      },
      {
        question: "What will I build in Enterprise AI Literacy Program?",
        answer:
          "You will build a safe-prompting checklist for everyday tasks, a before-and-after workflow using AI for drafting and summaries, and a capstone team guide covering use cases, limits, and data-handling rules.",
      },
      {
        question: "What careers or roles does Enterprise AI Literacy Program support?",
        answer:
          "Relevant roles include Operations Associate, Customer Support Specialist, HR Coordinator, Marketing Associate, Sales Associate, Project Coordinator, Executive Assistant, and Data Entry Specialist.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Software developers",
      "Backend developers",
      "AI engineers",
      "Platform engineers",
      "DevOps practitioners",
      "Data engineers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Familiarity with tool-calling concepts",
      "Basic knowledge of client-server integration",
    ],
    technologies: [
      "Model Context Protocol",
      "MCP servers",
      "MCP clients",
      "Tool schemas",
      "API connectors",
      "Authentication controls",
      "Test harnesses",
    ],
    projects: [
      "MCP server build",
      "Tool integration project",
      "Secure MCP connector",
      "Multi-tool agent workflow",
      "Capstone: Production MCP-enabled assistant with tool suite",
    ],
    skills: [
      "Protocol concepts",
      "Server development",
      "Tool schema design",
      "Client integration",
      "Access controls",
      "Conformance testing",
    ],
    hoursPerWeek: "8-10 hours/week",
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
      {
        question: "Who should take this course?",
        answer:
          "Developers comfortable with Python and REST APIs who want to build tool-using AI systems with contracts and evals.",
      },
      {
        question: "What will I build?",
        answer:
          "You will build an MCP server with tool contracts, a secure connector, and a capstone tool-using assistant with an eval report.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as MCP engineer, AI integration engineer, backend developer, and applied AI engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
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
    audience: [
      "AI engineers",
      "ML engineers",
      "Software developers",
      "Data scientists",
      "Product managers",
      "Engineering managers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Familiarity with LLM applications or RAG pipelines",
      "Basic statistics and evaluation metrics",
    ],
    technologies: [
      "LLM eval harnesses",
      "Golden datasets",
      "LLM-as-judge",
      "Regression pipelines",
      "Observability dashboards",
      "Prompt versioning",
      "Trajectory metrics",
    ],
    projects: [
      "Golden-set eval suite for a Q&A assistant",
      "LLM-as-judge grading pipeline",
      "Regression harness for prompt changes",
      "Capstone: End-to-end eval system with dashboards and guardrails",
    ],
    skills: [
      "Eval dataset design",
      "Groundedness measurement",
      "Regression testing",
      "Trajectory analysis",
      "Failure-mode triage",
      "Eval automation",
    ],
    hoursPerWeek: "8-10 hours/week",
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
    faqs: [
      {
        question: "Who should take AI Evals Engineering and what are the prerequisites?",
        answer:
          "This course is for engineers and technical evaluators building repeatable LLM test systems. Prerequisites include working Python skills, familiarity with test design and datasets, and basic statistics such as accuracy and pass rates.",
      },
      {
        question: "What will I build in AI Evals Engineering?",
        answer:
          "You will build a dataset-backed eval harness with task-specific scorers, a regression suite for RAG and agent behaviors, and a capstone eval pipeline with dashboards and failure triage reports.",
      },
      {
        question: "What careers or roles does AI Evals Engineering support?",
        answer:
          "Relevant roles include AI Evals Engineer, Quality Engineer for AI, Applied ML Engineer, Data Scientist, Test Automation Engineer, Model Risk Analyst, and AI Platform Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "AI engineers",
      "Data engineers",
      "Backend developers",
      "Data scientists",
      "Software developers",
      "Researchers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Basic familiarity with embeddings and databases",
      "Understanding of data modeling concepts",
    ],
    technologies: [
      "Knowledge graphs",
      "Vector databases",
      "Embedding models",
      "Hybrid retrieval",
      "Graph query languages",
      "Reranking models",
      "Entity resolution",
    ],
    projects: [
      "Entity-grounded movie knowledge graph",
      "Vector search index with hybrid ranking",
      "Graph-augmented retrieval API",
      "Capstone: Entity-grounded AI retrieval system with graph plus vector search",
    ],
    skills: [
      "Graph modeling",
      "Vector indexing",
      "Hybrid ranking",
      "Entity linking",
      "Retrieval tuning",
      "Schema design",
    ],
    hoursPerWeek: "8-10 hours/week",
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
    faqs: [
      {
        question:
          "Who should take Knowledge Graphs and Vector Systems and what are the prerequisites?",
        answer:
          "This course is for data engineers, backend developers, and AI engineers working with structured and semantic search. Prerequisites include basic Python and SQL, familiarity with JSON data, and introductory embeddings concepts.",
      },
      {
        question: "What will I build in Knowledge Graphs and Vector Systems?",
        answer:
          "You will build an entity-and-relationship graph from sample records, a hybrid search service combining vectors and graph queries, and a capstone knowledge assistant with cited graph-backed answers.",
      },
      {
        question: "What careers or roles does Knowledge Graphs and Vector Systems support?",
        answer:
          "Relevant roles include Knowledge Engineer, Graph Data Engineer, Search Engineer, Data Engineer, Semantic Search Developer, Ontology Analyst, and Applied AI Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Data engineers",
      "AI engineers",
      "ML engineers",
      "Backend developers",
      "Data scientists",
      "Platform engineers",
    ],
    prerequisites: [
      "Comfortable with Python and SQL",
      "Familiarity with cloud storage and APIs",
      "Basic data modeling knowledge",
    ],
    technologies: [
      "Batch pipelines",
      "Streaming systems",
      "Data lakes",
      "Feature stores",
      "Data contracts",
      "Workflow orchestration",
      "Schema registries",
    ],
    projects: [
      "Batch pipeline for AI training data",
      "Streaming ingestion pipeline with contracts",
      "Feature store for model and retrieval teams",
      "Capstone: Production data platform serving ML and generative AI workloads",
    ],
    skills: [
      "Pipeline design",
      "Lakehouse modeling",
      "Stream processing",
      "Feature engineering",
      "Data contract design",
      "Orchestration",
      "Data quality monitoring",
    ],
    hoursPerWeek: "6-8 hours/week",
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
    faqs: [
      {
        question: "Who should take Data Engineering for AI and what are the prerequisites?",
        answer:
          "This course is for software engineers, data analysts, and Python programmers moving into data engineering for AI workloads. Prerequisites include basic Python, basic SQL, and familiarity with command line and Git.",
      },
      {
        question: "What will I build in Data Engineering for AI?",
        answer:
          "You will build a batch ETL pipeline with validation tests, a streaming ingestion pipeline for model features, and a capstone AI-ready data platform with curated datasets, feature tables, and documentation.",
      },
      {
        question: "What careers or roles does Data Engineering for AI support?",
        answer:
          "Relevant roles include Data Engineer, AI Data Engineer, Analytics Engineer, ETL Developer, Data Platform Engineer, Machine Learning Data Specialist, and Data Operations Analyst.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "ML engineers",
      "AI engineers",
      "DevOps practitioners",
      "Data engineers",
      "Software developers",
      "Platform engineers",
    ],
    prerequisites: [
      "Strong Python and ML workflow experience",
      "Familiarity with containers and CI/CD",
      "Experience training and versioning models",
    ],
    technologies: [
      "Pipeline orchestration",
      "Experiment tracking",
      "Model registries",
      "Container runtimes",
      "CI/CD pipelines",
      "Drift monitoring",
      "Feature stores",
    ],
    projects: [
      "Reproducible training DAG with experiment tracking",
      "Model registry with staged promotion",
      "Deployment pipeline with canary rollout",
      "Capstone: Full ML lifecycle platform with drift-aware monitoring",
    ],
    skills: [
      "Pipeline automation",
      "Experiment management",
      "Model versioning",
      "Deployment orchestration",
      "Drift detection",
      "Reproducibility practices",
    ],
    hoursPerWeek: "6-8 hours/week",
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
    faqs: [
      {
        question: "Who should take MLOps Pipeline Engineering and what are the prerequisites?",
        answer:
          "This course is for ML engineers, data scientists, and backend engineers who want to productionize ML systems. Prerequisites include Python, basic machine learning concepts, Git, and familiarity with APIs and containers.",
      },
      {
        question: "What will I build in MLOps Pipeline Engineering?",
        answer:
          "You will build a versioned training pipeline with experiment tracking, a CI and CD pipeline for model deployment with monitoring, and a capstone end to end MLOps system with retraining, registry, and rollout controls.",
      },
      {
        question: "What careers or roles does MLOps Pipeline Engineering support?",
        answer:
          "Relevant roles include MLOps Engineer, Machine Learning Engineer, ML Platform Engineer, Model Operations Analyst, AI Systems Engineer, DevOps Engineer for ML, and Applied ML Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Software developers",
      "Frontend developers",
      "Backend developers",
      "AI engineers",
      "Engineering managers",
      "Entrepreneurs",
    ],
    prerequisites: [
      "Comfortable with a modern programming language",
      "Familiarity with git and terminal workflows",
      "Basic experience building software projects",
    ],
    technologies: [
      "Claude Code",
      "AI coding agents",
      "Prompt workflows",
      "Repository context management",
      "Automated testing",
      "Code review tooling",
      "Version control",
    ],
    projects: [
      "AI-assisted CLI tool build",
      "Agent-driven feature implementation",
      "Tested refactor of a legacy module",
      "Capstone: Production-quality app shipped with agentic coding workflows",
    ],
    skills: [
      "Agentic coding workflows",
      "Context engineering",
      "Iterative prompting",
      "Test-driven generation",
      "Code review of AI output",
      "Task decomposition",
    ],
    hoursPerWeek: "8-10 hours/week",
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
    faqs: [
      {
        question:
          "Who should take AI-native Software Engineering with Claude Code and what are the prerequisites?",
        answer:
          "This course is for developers, CS students, and technical founders who want to build software using Claude Code assisted workflows. Prerequisites include basic programming in JavaScript or Python, Git basics, and comfort using a code editor and terminal.",
      },
      {
        question: "What will I build in AI-native Software Engineering with Claude Code?",
        answer:
          "You will build a CLI tool developed with AI-assisted planning and testing, a full-stack web app with AI-generated tests and refactors, and a capstone production-ready app with specs, review workflows, and documentation.",
      },
      {
        question:
          "What careers or roles does AI-native Software Engineering with Claude Code support?",
        answer:
          "Relevant roles include Software Engineer, Frontend Developer, Backend Developer, Full-Stack Developer, AI Tooling Specialist, QA Automation Engineer, and Developer Productivity Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Software developers",
      "Backend developers",
      "AI engineers",
      "ML engineers",
      "Engineering managers",
      "Platform engineers",
    ],
    prerequisites: [
      "Strong backend or distributed systems experience",
      "Familiarity with APIs, queues, and databases",
      "Basic understanding of LLM applications",
    ],
    technologies: [
      "Distributed systems",
      "Load balancing",
      "Caching layers",
      "Message queues",
      "Vector retrieval",
      "Inference serving",
      "Observability stacks",
    ],
    projects: [
      "Scalable inference serving design",
      "Retrieval-backed assistant architecture",
      "Agentic workflow system with failure handling",
      "Capstone: Interview-ready distributed AI system design with latency and cost analysis",
    ],
    skills: [
      "Distributed architecture",
      "Latency budgeting",
      "Cost modeling",
      "Failure-mode design",
      "Scaling inference",
      "Caching strategy",
    ],
    hoursPerWeek: "6-8 hours/week",
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
    faqs: [
      {
        question: "Who should take System Design for the AI Era and what are the prerequisites?",
        answer:
          "This course is for backend engineers, full-stack developers, and engineering leads preparing for system design interviews and AI product work. Prerequisites include programming experience, basic API and database knowledge, and familiarity with cloud concepts.",
      },
      {
        question: "What will I build in System Design for the AI Era?",
        answer:
          "You will design a scalable RAG service with retrieval and caching, an async AI inference architecture with queues and rate limits, and a capstone system design portfolio covering an AI product with diagrams, tradeoffs, and scaling plans.",
      },
      {
        question: "What careers or roles does System Design for the AI Era support?",
        answer:
          "Relevant roles include Backend Engineer, Solutions Architect, Platform Engineer, AI Systems Designer, Cloud Architect, Technical Lead, and Infrastructure Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Cloud engineers",
      "DevOps practitioners",
      "Security practitioners",
      "Backend developers",
      "Platform engineers",
      "IT administrators",
    ],
    prerequisites: [
      "Familiarity with cloud consoles and Linux CLI",
      "Basic networking and IAM concepts",
      "Experience with CI/CD pipelines",
    ],
    technologies: [
      "Cloud IAM",
      "Container scanning",
      "Infrastructure as code",
      "Secrets management",
      "CI security gates",
      "Network policies",
      "SIEM tooling",
    ],
    projects: [
      "Hardened cloud landing zone with IAM guardrails",
      "Secure CI/CD pipeline with image scanning",
      "Secrets rotation and policy-as-code setup",
      "Capstone: DevSecOps platform with continuous compliance monitoring",
    ],
    skills: [
      "Threat modeling",
      "IAM hardening",
      "Pipeline security",
      "Vulnerability remediation",
      "Policy as code",
      "Incident response basics",
    ],
    hoursPerWeek: "6-8 hours/week",
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
    faqs: [
      {
        question: "Who should take Cloud Security and DevSecOps and what are the prerequisites?",
        answer:
          "This course is for cloud engineers, DevOps practitioners, and developers responsible for secure deployments. Prerequisites include basic Linux, Git, networking fundamentals, and familiarity with a major cloud platform.",
      },
      {
        question: "What will I build in Cloud Security and DevSecOps?",
        answer:
          "You will build a hardened CI and CD pipeline with secrets scanning and image checks, a cloud landing setup with IAM policies and logging, and a capstone secure deployment project with threat review and remediation runbooks.",
      },
      {
        question: "What careers or roles does Cloud Security and DevSecOps support?",
        answer:
          "Relevant roles include DevSecOps Engineer, Cloud Security Engineer, Site Reliability Engineer, Platform Engineer, Security Operations Analyst, Cloud Administrator, and Release Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Security practitioners",
      "AI engineers",
      "ML engineers",
      "Technology leaders",
      "Product managers",
      "Engineering managers",
    ],
    prerequisites: [
      "Familiarity with LLM applications and APIs",
      "Basic security concepts such as auth and data handling",
      "Understanding of software delivery lifecycles",
    ],
    technologies: [
      "Prompt injection defenses",
      "Red-teaming toolkits",
      "Access controls",
      "Audit logging",
      "Content filtering",
      "Model provenance",
      "Policy frameworks",
    ],
    projects: [
      "Threat model for an LLM application",
      "Red-team exercise with mitigations",
      "Logging and audit trail for AI actions",
      "Capstone: Secure AI deployment plan with governance controls",
    ],
    skills: [
      "AI threat analysis",
      "Adversarial testing",
      "Guardrail design",
      "Audit readiness",
      "Risk assessment",
      "Secure deployment practices",
    ],
    hoursPerWeek: "6-8 hours/week",
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
    faqs: [
      {
        question: "Who should take AI Security and Governance and what are the prerequisites?",
        answer:
          "This course is for ML engineers, security analysts, product managers, and compliance staff working with AI systems. Prerequisites include basic understanding of ML or software systems, plus familiarity with data handling and access controls.",
      },
      {
        question: "What will I build in AI Security and Governance?",
        answer:
          "You will build an AI risk assessment for a sample model deployment, a prompt injection and data leakage test suite, and a capstone AI security review package with controls, logging plan, and incident response checklist.",
      },
      {
        question: "What careers or roles does AI Security and Governance support?",
        answer:
          "Relevant roles include AI Security Analyst, Product Security Engineer, AI Risk Analyst, Trust and Safety Analyst, Compliance Analyst for AI, Security Consultant, and AI Policy Analyst.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Students",
      "Career changers",
      "Data analysts",
      "Product managers",
      "Operations staff",
      "Entrepreneurs",
    ],
    prerequisites: [
      "No previous analytics experience required",
      "Comfort with spreadsheets and basic math",
      "Willingness to learn Python or SQL basics",
    ],
    technologies: [
      "SQL",
      "Spreadsheets",
      "Python notebooks",
      "Visualization libraries",
      "Dashboards",
      "Descriptive statistics",
      "Data cleaning tools",
    ],
    projects: [
      "Exploratory sales dataset analysis",
      "SQL reporting pack with joins and aggregations",
      "Interactive dashboard for KPI tracking",
      "Capstone: End-to-end analytics report with findings and recommendations",
    ],
    skills: [
      "Data wrangling",
      "SQL querying",
      "Descriptive analysis",
      "Data visualization",
      "Dashboard design",
      "Insight communication",
    ],
    hoursPerWeek: "6-8 hours/week",
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
    faqs: [
      {
        question:
          "Who should take Data Analytics Fundamentals with SQL, Python and Power BI and what are the prerequisites?",
        answer:
          "This course is for beginners, career switchers, business analysts, and students starting in data analytics. No prior coding is required, though basic Excel and comfort with numbers are helpful.",
      },
      {
        question: "What will I build in Data Analytics Fundamentals with SQL, Python and Power BI?",
        answer:
          "You will build SQL query projects for business reporting, Python notebooks for data cleaning and exploratory analysis, and a capstone Power BI dashboard with KPIs, filters, and insights from a real-world style dataset.",
      },
      {
        question:
          "What careers or roles does Data Analytics Fundamentals with SQL, Python and Power BI support?",
        answer:
          "Relevant roles include Data Analyst, Business Intelligence Analyst, Reporting Analyst, Operations Analyst, Marketing Analyst, Junior Data Analyst, and Business Analyst.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Software developers",
      "Frontend developers",
      "Backend developers",
      "AI engineers",
      "Entrepreneurs",
      "Product managers",
    ],
    prerequisites: [
      "Comfortable with JavaScript and React basics",
      "Familiarity with APIs and databases",
      "Experience with git and Node tooling",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "Edge runtime",
      "Auth providers",
      "Payment APIs",
      "Observability tooling",
      "LLM APIs",
      "Relational databases",
    ],
    projects: [
      "Typed Next.js app with auth and payments",
      "RAG feature with structured outputs",
      "Agent integration with production guardrails",
      "Capstone: Production full-stack app with LLM features and observability",
    ],
    skills: [
      "Full-stack TypeScript",
      "Server rendering",
      "API design",
      "Auth integration",
      "LLM feature integration",
      "Testing and observability",
    ],
    hoursPerWeek: "5-7 hours/week",
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
    faqs: [
      {
        question:
          "Who should take Full-Stack Engineering with Next.js and AI Features and what are the prerequisites?",
        answer:
          "This course is for frontend and backend developers, bootcamp graduates, and JavaScript engineers moving to full-stack work. Prerequisites include JavaScript and React basics, Git, and familiarity with REST APIs.",
      },
      {
        question: "What will I build in Full-Stack Engineering with Next.js and AI Features?",
        answer:
          "You will build a Next.js app with auth and database integration, an AI chat and search feature using an LLM API, and a capstone full-stack product with deployment, testing, and admin dashboard.",
      },
      {
        question:
          "What careers or roles does Full-Stack Engineering with Next.js and AI Features support?",
        answer:
          "Relevant roles include Full-Stack Developer, Frontend Engineer, Next.js Developer, Backend Engineer with Node, Web Application Developer, AI Features Developer, and Product Engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
    audience: [
      "Technology leaders",
      "Product managers",
      "Engineering managers",
      "Operations staff",
      "Security practitioners",
      "Entrepreneurs",
    ],
    prerequisites: [
      "Familiarity with AI products or business processes",
      "No advanced coding required",
      "Interest in policy and risk management",
    ],
    technologies: [
      "Risk registers",
      "Policy templates",
      "Impact assessments",
      "Audit checklists",
      "Incident playbooks",
      "Documentation standards",
      "Review boards",
    ],
    projects: [
      "AI use-case risk register",
      "Responsible-use policy draft",
      "Pre-deployment review checklist",
      "Capstone: Responsible deployment plan with governance model and monitoring",
    ],
    skills: [
      "Risk framing",
      "Policy drafting",
      "Impact assessment",
      "Stakeholder alignment",
      "Oversight design",
      "Responsible rollout planning",
    ],
    hoursPerWeek: "8-10 hours/week",
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
    faqs: [
      {
        question:
          "Who should take AI Governance and Responsible Deployment and what are the prerequisites?",
        answer:
          "This course is for product leaders, operations teams, policy staff, and engineers involved in deploying AI responsibly. Prerequisites include general familiarity with AI products and organizational processes, no advanced coding required.",
      },
      {
        question: "What will I build in AI Governance and Responsible Deployment?",
        answer:
          "You will build a responsible AI checklist and model documentation pack, an evaluation and bias review for a sample use case, and a capstone deployment governance plan with approval workflows, monitoring, and escalation procedures.",
      },
      {
        question: "What careers or roles does AI Governance and Responsible Deployment support?",
        answer:
          "Relevant roles include AI Governance Analyst, Responsible AI Specialist, AI Program Manager, Risk and Compliance Analyst, AI Operations Manager, Trust and Safety Specialist, and Technology Policy Advisor.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
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
  // ============================================================
  // HIGAET Original Catalog - 72 discipline courses (2026-09)
  // AI & Generative AI (16) -> Software (11) -> Cloud (10) ->
  // Data & ML (11) -> Cybersecurity (10) -> Emerging (7) ->
  // Leadership (7). Titles are authoritative; fee = to be configured.
  // ============================================================
  {
    id: "academy_course_genai_engineering",
    slug: "generative-ai-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET Generative AI Engineering",
    summary:
      "Learn prompt design, LLM APIs, embeddings, and vector search while building chatbots, summarizers, and multimodal prototypes through guided practical training.",
    duration: "12 weeks",
    level: "intermediate",
    mode: "hybrid",
    audience: [
      "Students",
      "Career changers",
      "Software developers",
      "Backend developers",
      "AI engineers",
      "Entrepreneurs",
    ],
    prerequisites: [
      "No previous generative AI experience required",
      "Basic Python familiarity for guided labs",
      "Comfort using web APIs and JSON",
      "Laptop with internet access for cloud-based exercises",
    ],
    technologies: [
      "LLM APIs",
      "Embedding models",
      "Vector databases",
      "Prompt templates",
      "Output schemas",
      "Containers",
      "Chat APIs",
    ],
    projects: [
      "Structured prompt template library",
      "Document summarizer service",
      "Retrieval-grounded chatbot",
      "Multimodal prototype assistant",
      "Capstone: Containerized generative AI chatbot service",
    ],
    skills: [
      "Prompt design",
      "LLM API integration",
      "Embedding workflows",
      "Vector search",
      "Output structuring",
      "Service deployment",
      "Response logging",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build production-style LLM features using chat, completion, and embedding APIs",
      "Design structured prompts, templates, and output schemas for reliable responses",
      "Develop retrieval-grounded assistants backed by curated knowledge sources",
      "Deploy containerized generative AI services with logging and versioning",
      "Integrate function calling, file handling, and third-party APIs",
      "Evaluate response quality with task-based rubrics and regression checks",
      "Secure API keys, redact sensitive data, and apply usage controls",
      "Optimize token usage, latency, and cost across model selections",
    ],
    curriculum: [
      "Module 01 — Foundations: How transformers, tokens, and LLM APIs work",
      "Module 02 — Prompt Engineering: Patterns, templates, and structured outputs",
      "Module 03 — Core: Embeddings, chunking, and vector database workflows",
      "Module 04 — Engineering: Function calling and tool-connected assistants",
      "Module 05 — Engineering: Document Q&A and summarization pipelines",
      "Module 06 — Advanced: Multimodal inputs, images, and audio handling",
      "Module 07 — Production: Deployment, monitoring, cost control, and safety filters",
      "Module 08 — Capstone: Design and deploy a grounded generative AI product",
    ],
    faqs: [
      {
        question: "Who should take this course?",
        answer:
          "Developers, analysts, and product builders with basic Python and API experience. Familiarity with JSON, Git, and command-line workflows helps with HIGAET Practical Training / Experiential Learning labs.",
      },
      {
        question: "What will I build?",
        answer:
          "A support chatbot, a document summarizer, and a capstone grounded assistant with retrieval, tool calls, and a deployed demo interface.",
      },
      {
        question: "What careers does this support?",
        answer:
          "Relevant roles include AI application developer, prompt engineer, LLM integration developer, chatbot developer, solutions engineer, and technical product builder.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Generative AI Engineering | HIGAET Academy",
      description:
        "Learn LLM APIs, prompts, embeddings, and deployment by building chatbots and grounded AI apps in HIGAET Academy practical training.",
      keywords: [
        "generative ai",
        "llm apis",
        "prompt engineering",
        "embeddings",
        "vector databases",
        "chatbots",
        "ai application developer",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_agentic_ai_engineering",
    slug: "agentic-ai-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET Agentic AI Engineering",
    summary:
      "Design autonomous agents with planning, memory, and tools, covering orchestration, multi-agent collaboration, and guardrails through hands-on engineering projects.",
    duration: "10 weeks",
    level: "advanced",
    mode: "hybrid",
    audience: [
      "Software developers",
      "Backend developers",
      "AI engineers",
      "ML engineers",
      "Platform engineers",
      "Engineering managers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Familiarity with LLM APIs and prompts",
      "Basic understanding of state stores and queues",
    ],
    technologies: [
      "Agent frameworks",
      "LLM APIs",
      "Tool calling",
      "State stores",
      "Orchestration runtimes",
      "Guardrail filters",
      "Conversation memory",
    ],
    projects: [
      "Tool-using planning agent",
      "Reflection and task-decomposition loop",
      "Multi-agent collaboration system",
      "Capstone: Guardrailed multi-agent orchestration platform",
    ],
    skills: [
      "Agent design",
      "Task planning",
      "Tool orchestration",
      "Memory management",
      "Multi-agent handoffs",
      "Guardrail design",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Architect single and multi-agent systems with defined roles and handoffs",
      "Build planning, reflection, and task-decomposition loops for agents",
      "Develop persistent memory using state stores and conversation history",
      "Integrate browsers, code runners, databases, and custom tools",
      "Deploy agent services with job queues, retries, and human approval gates",
      "Evaluate task success, tool accuracy, and failure recovery paths",
      "Secure agent actions with scopes, allowlists, and audit trails",
      "Optimize step counts, context size, and execution cost",
    ],
    curriculum: [
      "Module 01 — Foundations: Agent loops, planners, tools, and memory models",
      "Module 02 — Core: Tool design, schemas, error handling, and retries",
      "Module 03 — Core: Memory systems, state management, and context budgets",
      "Module 04 — Engineering: Single-agent task automation workflows",
      "Module 05 — Engineering: Multi-agent collaboration and supervisor patterns",
      "Module 06 — Advanced: Browser, code, and data tools for agents",
      "Module 07 — Production: Guardrails, approvals, observability, and cost control",
      "Module 08 — Capstone: Ship a multi-agent system for a defined operations task",
    ],
    faqs: [
      {
        question: "Who should take this course?",
        answer:
          "Intermediate Python developers comfortable with APIs and LLM basics. Prior work with prompts, JSON, and async workflows helps with HIGAET Practical Training / Experiential Learning agent labs.",
      },
      {
        question: "What will I build?",
        answer:
          "A research assistant agent, a multi-agent support triage workflow, and a capstone operations agent with tools, memory, and approval gates.",
      },
      {
        question: "What careers does this support?",
        answer:
          "Relevant roles include AI agent developer, automation engineer, applied AI engineer, workflow engineer, solutions architect, and platform engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Agentic AI Engineering | HIGAET Academy",
      description:
        "Build planning agents, tool integrations, memory, and multi-agent workflows with guardrails in HIGAET Academy engineering labs.",
      keywords: [
        "agentic ai",
        "ai agents",
        "multi-agent systems",
        "tool use",
        "agent memory",
        "orchestration",
        "automation engineer",
        "applied ai engineer",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_agent_builder",
    slug: "ai-agent-builder",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI Agent Builder",
    summary:
      "Build practical no-code and low-code AI agents using visual builders, knowledge bases, and integrations, ending with a deployed assistant for a real workflow.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Students",
      "Career changers",
      "Operations staff",
      "Product managers",
      "Entrepreneurs",
      "IT administrators",
    ],
    prerequisites: [
      "No previous AI agent experience required",
      "Comfort using web apps and visual builders",
      "Access to sample documents or FAQs for labs",
    ],
    technologies: [
      "Visual agent builders",
      "Conversational flows",
      "Knowledge bases",
      "Intent models",
      "Integration connectors",
      "Deployment dashboards",
    ],
    projects: [
      "FAQ knowledge-backed assistant",
      "Intent and escalation flow bot",
      "Integrated workflow assistant",
      "Capstone: Deployed no-code assistant for a real workflow",
    ],
    skills: [
      "Visual agent building",
      "Intent design",
      "Fallback handling",
      "Knowledge-base grounding",
      "Workflow integration",
      "Assistant deployment",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build assistants with visual agent builders and conversational flows",
      "Design intents, entities, fallback paths, and escalation rules",
      "Develop knowledge-backed answers from documents and FAQs",
      "Integrate spreadsheets, CRMs, forms, and messaging channels",
      "Deploy agents to web widgets and team workspaces",
      "Evaluate conversation logs and improve failed turns",
      "Secure access controls, data retention, and PII handling",
      "Automate follow-ups, ticket creation, and notification workflows",
    ],
    curriculum: [
      "Module 01 — Foundations: Agent builder concepts, flows, and use cases",
      "Module 02 — Core: Conversation design, intents, and fallback handling",
      "Module 03 — Core: Knowledge bases, documents, and grounded answers",
      "Module 04 — Engineering: Integrations with forms, sheets, and CRMs",
      "Module 05 — Engineering: Deployment to web, chat, and workspace channels",
      "Module 06 — Advanced: Analytics, log review, and iteration cycles",
      "Module 07 — Production: Privacy, access control, and handoff design",
      "Module 08 — Capstone: Launch a deployed agent for a selected support workflow",
    ],
    faqs: [
      {
        question: "Who should take this course?",
        answer:
          "Founders, operators, marketers, and analysts with basic computer skills. No prior coding is required; comfort with documents and spreadsheets supports HIGAET Practical Training / Experiential Learning work.",
      },
      {
        question: "What will I build?",
        answer:
          "A FAQ assistant, a lead-capture agent with CRM integration, and a capstone deployed agent covering one complete business workflow.",
      },
      {
        question: "What careers does this support?",
        answer:
          "Relevant roles include AI agent builder, chatbot specialist, business automation analyst, customer support technologist, operations associate, and freelance AI consultant.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Agent Builder | HIGAET Academy",
      description:
        "Create no-code AI agents with knowledge bases, integrations, and deployment using visual builders in practical HIGAET Academy labs.",
      keywords: [
        "ai agent builder",
        "no-code ai",
        "chatbot builder",
        "conversation design",
        "knowledge base",
        "business automation",
        "support technologist",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_llm_engineering",
    slug: "llm-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET LLM Engineering",
    summary:
      "Go deep on model selection, fine-tuning, inference optimization, and serving, with labs on data preparation, adapters, and production LLM endpoints.",
    duration: "10 weeks",
    level: "advanced",
    mode: "hybrid",
    audience: [
      "AI engineers",
      "ML engineers",
      "Data scientists",
      "Backend developers",
      "Platform engineers",
      "Researchers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Familiarity with LLM APIs and model concepts",
      "Basic data cleaning and evaluation knowledge",
    ],
    technologies: [
      "Open models",
      "Hosted model APIs",
      "Fine-tuning runtimes",
      "Adapter methods",
      "Inference servers",
      "Batching systems",
      "Response caches",
    ],
    projects: [
      "Model selection benchmark report",
      "Instruction dataset preparation pipeline",
      "Parameter-efficient fine-tuning run",
      "Capstone: Production LLM inference endpoint",
    ],
    skills: [
      "Model selection",
      "Dataset curation",
      "Fine-tuning",
      "Adapter training",
      "Inference optimization",
      "Endpoint deployment",
      "Latency-cost analysis",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Evaluate open and hosted models for quality, latency, and cost trade-offs",
      "Develop instruction and preference datasets with cleaning and deduping",
      "Build fine-tuning runs using parameter-efficient adapter methods",
      "Deploy scalable inference endpoints with batching and caching",
      "Integrate guardrails, structured outputs, and fallback models",
      "Architect long-context handling with chunking and summarization",
      "Secure model artifacts, datasets, and endpoint access",
      "Optimize throughput, quantization, and serving costs",
    ],
    curriculum: [
      "Module 01 — Foundations: Model families, tokenizers, and context windows",
      "Module 02 — Core: Model selection, benchmarks, and routing strategies",
      "Module 03 — Core: Dataset design, cleaning, and instruction formatting",
      "Module 04 — Engineering: Adapter-based fine-tuning and checkpoint review",
      "Module 05 — Engineering: Inference servers, batching, and caching",
      "Module 06 — Advanced: Long-context design and structured generation",
      "Module 07 — Production: Serving, scaling, monitoring, and fallback design",
      "Module 08 — Capstone: Fine-tune and serve a task-specialized model endpoint",
    ],
    faqs: [
      {
        question: "Who should take this course?",
        answer:
          "Python developers and ML practitioners comfortable with APIs, dataframes, and training concepts. Basic Linux and Git experience supports HIGAET Practical Training / Experiential Learning serving labs.",
      },
      {
        question: "What will I build?",
        answer:
          "A model comparison study, a fine-tuned support classifier, and a capstone served endpoint with inference caching and monitoring.",
      },
      {
        question: "What careers does this support?",
        answer:
          "Relevant roles include LLM engineer, ML engineer, NLP engineer, MLOps engineer, applied scientist associate, and AI platform engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "LLM Engineering | HIGAET Academy",
      description:
        "Master fine-tuning, inference serving, model routing, and optimization by shipping a task-specialized LLM endpoint with HIGAET Academy.",
      keywords: [
        "llm engineering",
        "fine-tuning",
        "inference serving",
        "model evaluation",
        "quantization",
        "nlp engineer",
        "mlops engineer",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_rag_application_engineering",
    slug: "rag-application-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET RAG Application Engineering",
    summary:
      "Engineer retrieval-augmented generation systems covering chunking, embeddings, hybrid search, reranking, citations, and grounded answer evaluation.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "AI engineers",
      "Data engineers",
      "ML engineers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Familiarity with embeddings and databases",
      "Basic text processing knowledge",
    ],
    technologies: [
      "Embedding models",
      "Vector indexes",
      "Hybrid search",
      "Rerankers",
      "Document parsers",
      "Citation renderers",
      "Q&A APIs",
    ],
    projects: [
      "Document ingestion and chunking pipeline",
      "Hybrid search with reranking service",
      "Citation-grounded Q&A API",
      "Capstone: Grounded retrieval Q&A application with evaluation",
    ],
    skills: [
      "Document chunking",
      "Embedding design",
      "Vector indexing",
      "Hybrid retrieval",
      "Reranking",
      "Citation grounding",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build document ingestion pipelines with parsing, cleaning, and chunking",
      "Design embedding workflows and vector index schemas",
      "Develop hybrid search with dense, lexical, and reranking stages",
      "Deploy grounded Q&A APIs with citations and source links",
      "Integrate access filters, metadata routing, and refresh jobs",
      "Evaluate faithfulness, recall, and answer relevance",
      "Secure indexes with tenant isolation and redaction rules",
      "Optimize chunk size, top-k selection, and query latency",
    ],
    curriculum: [
      "Module 01 — Foundations: RAG architectures and grounding concepts",
      "Module 02 — Core: Document parsing, cleaning, and chunking strategies",
      "Module 03 — Core: Embeddings, vector stores, and metadata design",
      "Module 04 — Engineering: Hybrid search, filters, and rerankers",
      "Module 05 — Engineering: Grounded answering with citations",
      "Module 06 — Advanced: RAG evaluation, failure analysis, and tuning",
      "Module 07 — Production: Refresh pipelines, access control, and monitoring",
      "Module 08 — Capstone: Ship a cited Q&A app over a document collection",
    ],
    faqs: [
      {
        question: "Who should take this course?",
        answer:
          "Developers with basic Python and API skills who want search-grounded assistants. Familiarity with databases and JSON supports HIGAET Practical Training / Experiential Learning labs.",
      },
      {
        question: "What will I build?",
        answer:
          "A policy document Q&A tool, a hybrid search prototype with reranking, and a capstone cited assistant with refresh and evaluation checks.",
      },
      {
        question: "What careers does this support?",
        answer:
          "Relevant roles include RAG developer, search engineer, knowledge assistant developer, applied AI engineer, data application developer, and solutions engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "RAG App Engineering | HIGAET Academy",
      description:
        "Build cited RAG apps with chunking, embeddings, hybrid search, reranking, and grounding checks in HIGAET Academy labs.",
      keywords: [
        "rag",
        "retrieval augmented generation",
        "embeddings",
        "vector search",
        "hybrid search",
        "reranking",
        "search engineer",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_mcp_application_engineering",
    slug: "mcp-application-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET MCP Engineering",
    summary:
      "Build Model Context Protocol servers and clients, exposing tools, resources, and prompts with schemas, auth, and production-ready deployment practices.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "AI engineers",
      "Platform engineers",
      "Cloud engineers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Familiarity with JSON schemas and auth concepts",
      "Basic client-server development knowledge",
    ],
    technologies: [
      "Model Context Protocol",
      "MCP servers",
      "MCP clients",
      "JSON schemas",
      "Capability manifests",
      "OAuth tokens",
      "Deployment runtimes",
    ],
    projects: [
      "Tool-exposing MCP server",
      "Resource and prompt MCP service",
      "MCP discovery client",
      "Capstone: Production-ready MCP server and client deployment",
    ],
    skills: [
      "MCP server design",
      "Tool exposure",
      "Schema definition",
      "Client integration",
      "Auth configuration",
      "Error handling",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Build MCP servers exposing tools, resources, and prompts",
      "Design JSON schemas, capability manifests, and error responses",
      "Develop MCP clients that discover and invoke server actions",
      "Integrate file, database, and API backends behind MCP tools",
      "Deploy versioned MCP servers with logging and health checks",
      "Evaluate tool correctness, schema compliance, and edge cases",
      "Secure tokens, scopes, rate limits, and input validation",
      "Automate regression tests for tool contracts and upgrades",
    ],
    curriculum: [
      "Module 01 — Foundations: MCP concepts, servers, clients, and transports",
      "Module 02 — Core: Tool definitions, schemas, and resources",
      "Module 03 — Core: Prompts, context assembly, and capability discovery",
      "Module 04 — Engineering: Backend integrations for files and APIs",
      "Module 05 — Production: Auth, validation, logging, and versioning",
      "Module 06 — Capstone: Ship a tested MCP server with a demo client",
    ],
    faqs: [
      {
        question: "Who should take this course?",
        answer:
          "Developers familiar with APIs, JSON schemas, and basic TypeScript or Python. Prior LLM tool-calling experience helps with HIGAET Practical Training / Experiential Learning server labs.",
      },
      {
        question: "What will I build?",
        answer:
          "A file-search MCP server, a database query tool set, and a capstone versioned MCP server with a working demo client.",
      },
      {
        question: "What careers does this support?",
        answer:
          "Relevant roles include MCP developer, AI integration engineer, backend developer, tooling engineer, platform engineer, and applied AI engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "MCP Engineering | HIGAET Academy",
      description:
        "Learn MCP servers, clients, tools, and resources by shipping a tested integrations server in HIGAET Academy labs.",
      keywords: [
        "model context protocol",
        "mcp servers",
        "mcp clients",
        "tool schemas",
        "ai integrations",
        "backend developer",
        "platform engineer",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_evals",
    slug: "ai-evals",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI Evals Engineering",
    summary:
      "Master offline and online evaluation for AI systems, covering datasets, judges, guardrails, regression suites, and production quality monitoring.",
    duration: "6 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "AI engineers",
      "ML engineers",
      "Data scientists",
      "Software developers",
      "Engineering managers",
      "Researchers",
    ],
    prerequisites: [
      "Familiarity with LLM APIs and prompts",
      "Comfortable with Python and datasets",
      "Basic statistics or quality-measurement concepts",
    ],
    technologies: [
      "Eval harnesses",
      "Gold datasets",
      "LLM judges",
      "Scoring rubrics",
      "Regression suites",
      "Drift monitors",
      "Guardrail filters",
    ],
    projects: [
      "Offline eval suite with gold sets",
      "LLM-judge scoring pipeline",
      "Prompt and retrieval regression suite",
      "Capstone: Production quality monitoring system with guardrails",
    ],
    skills: [
      "Eval design",
      "Rubric scoring",
      "Judge calibration",
      "Regression testing",
      "Drift detection",
      "Safety monitoring",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Build offline eval suites with gold sets and task rubrics",
      "Design LLM-judge and programmatic scoring methods",
      "Develop regression tests for prompts, retrieval, and agents",
      "Deploy online monitors for drift, toxicity, and refusal behavior",
      "Integrate guardrails and policy checks into serving paths",
      "Evaluate agreement rates, calibration, and failure clusters",
      "Secure eval data with sampling, masking, and access controls",
      "Optimize eval runtime, sampling strategy, and alert thresholds",
    ],
    curriculum: [
      "Module 01 — Foundations: Eval types, metrics, and quality dimensions",
      "Module 02 — Core: Dataset curation, gold sets, and rubric design",
      "Module 03 — Core: LLM judges, scoring functions, and calibration",
      "Module 04 — Engineering: Regression suites for RAG and agents",
      "Module 05 — Production: Guardrails, online monitoring, and alerting",
      "Module 06 — Capstone: Deliver an eval harness with dashboards and reports",
    ],
    faqs: [
      {
        question: "Who should take this course?",
        answer:
          "AI developers and QA engineers with Python and basic LLM app experience. Familiarity with datasets and statistics helps with HIGAET Practical Training / Experiential Learning eval labs.",
      },
      {
        question: "What will I build?",
        answer:
          "A rubric-based eval suite, a calibrated judge comparison, and a capstone regression harness with monitoring dashboards.",
      },
      {
        question: "What careers does this support?",
        answer:
          "Relevant roles include AI eval engineer, quality engineer for AI, applied AI engineer, trust and safety analyst, data analyst, and release engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Evals Engineering | HIGAET Academy",
      description:
        "Design eval suites, LLM judges, guardrails, and monitors to measure AI quality reliably in HIGAET Academy labs.",
      keywords: [
        "ai evals",
        "llm judges",
        "guardrails",
        "regression testing",
        "quality monitoring",
        "trust and safety",
        "quality engineer",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_automation_engineering",
    slug: "ai-automation-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI Automation Engineering",
    summary:
      "Automate business operations with AI workflows spanning triggers, extraction, approvals, and integrations across documents, email, and spreadsheets.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Operations staff",
      "Career changers",
      "Software developers",
      "IT administrators",
      "Entrepreneurs",
      "Product managers",
    ],
    prerequisites: [
      "No previous automation experience required",
      "Comfort with documents, email, and spreadsheets",
      "Basic familiarity with web apps and integrations",
    ],
    technologies: [
      "Workflow triggers",
      "Extraction models",
      "Approval queues",
      "Email connectors",
      "Spreadsheet connectors",
      "Document parsers",
      "Exception dashboards",
    ],
    projects: [
      "Trigger-based document workflow",
      "Invoice and form extraction pipeline",
      "Approval and escalation automation",
      "Capstone: End-to-end business operations automation",
    ],
    skills: [
      "Workflow design",
      "Trigger configuration",
      "Data extraction",
      "Approval routing",
      "Exception handling",
      "Systems integration",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build trigger-based AI workflows for documents and messages",
      "Design extraction schemas for invoices, forms, and emails",
      "Develop approval steps, escalations, and exception queues",
      "Integrate office suites, drives, queues, and webhooks",
      "Deploy scheduled and event-driven automation pipelines",
      "Evaluate accuracy, exception rates, and processing time",
      "Secure credentials, audit logs, and data retention policies",
      "Automate reporting, alerts, and status updates for stakeholders",
    ],
    curriculum: [
      "Module 01 — Foundations: Automation patterns, triggers, and actions",
      "Module 02 — Core: Document extraction and structured outputs",
      "Module 03 — Core: Workflow builders, branching, and approvals",
      "Module 04 — Engineering: Email, sheet, and drive integrations",
      "Module 05 — Engineering: Queues, webhooks, and error recovery",
      "Module 06 — Advanced: Monitoring, cost tracking, and iteration",
      "Module 07 — Production: Security, audit trails, and rollout planning",
      "Module 08 — Capstone: Deliver an end-to-end operations automation",
    ],
    faqs: [
      {
        question: "Who should take this course?",
        answer:
          "Operators, analysts, and developers with spreadsheet and workflow tool experience. Basic API familiarity helps with HIGAET Practical Training / Experiential Learning integration labs.",
      },
      {
        question: "What will I build?",
        answer:
          "An invoice extraction flow, an inbox triage automation, and a capstone operations pipeline with approvals and monitoring.",
      },
      {
        question: "What careers does this support?",
        answer:
          "Relevant roles include AI automation engineer, business systems analyst, operations engineer, integration specialist, workflow consultant, and support technologist.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Automation Engineering | HIGAET Academy",
      description:
        "Automate docs, email, and sheets with AI extraction, approvals, and monitored pipelines in HIGAET Academy labs.",
      keywords: [
        "ai automation",
        "workflow automation",
        "document extraction",
        "integrations",
        "approvals",
        "operations engineer",
        "systems analyst",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_product_management",
    slug: "ai-product-management",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI Product Management",
    summary:
      "Learn to scope, roadmap, and ship AI features through HIGAET Practical Training, building specs, evaluations, and launch plans for real product scenarios.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Product managers",
      "Engineering managers",
      "Technology leaders",
      "Entrepreneurs",
      "AI engineers",
      "Career changers",
    ],
    prerequisites: [
      "No previous AI product experience required",
      "Familiarity with product specs or roadmaps",
      "Basic understanding of AI features and user metrics",
    ],
    technologies: [
      "PRD templates",
      "Success metrics",
      "Eval plans",
      "Roadmapping boards",
      "Pilot dashboards",
      "Feedback loops",
      "Rollout checklists",
    ],
    projects: [
      "AI product requirements document",
      "Model-to-outcome evaluation plan",
      "Data-model-UX roadmap",
      "Capstone: Pilot launch plan with staged rollout criteria",
    ],
    skills: [
      "AI scoping",
      "Success metric design",
      "Evaluation planning",
      "Roadmap sequencing",
      "Pilot management",
      "Stakeholder communication",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build AI product requirement documents with success metrics and scope boundaries",
      "Design evaluation plans that link model quality to user and business outcomes",
      "Develop roadmaps that sequence data, model, and UX milestones pragmatically",
      "Deploy pilot launches with feedback loops and staged rollout criteria",
      "Integrate analytics and experimentation to guide AI feature iteration",
      "Evaluate build-versus-buy decisions across models, APIs, and vendors",
      "Secure stakeholder alignment with risk, cost, and limitation disclosures",
      "Optimize AI pricing, packaging, and lifecycle decisions from usage data",
    ],
    curriculum: [
      "Module 01 — Foundations: AI product lifecycle, capabilities, and constraints",
      "Module 02 — Discovery: user research and problem framing for AI features",
      "Module 03 — Scoping: PRDs, acceptance criteria, and evaluation metrics",
      "Module 04 — Data and Model Strategy: sourcing, quality, and vendor selection",
      "Module 05 — UX Engineering: designing for uncertainty, feedback, and trust",
      "Module 06 — Measurement: experiments, analytics, and iteration loops",
      "Module 07 — Launch: risk review, rollout planning, and lifecycle management",
      "Module 08 — Capstone: end-to-end AI product plan with roadmap and launch readiness",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Product managers, founders, analysts, and engineers moving into product roles. Prerequisites: basic familiarity with AI concepts and comfort reading product documents; no coding required.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build an AI PRD with evaluation metrics, a phased product roadmap, and a capstone launch plan covering pilot design, measurement, and iteration for a chosen AI feature.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "AI product manager, technical product manager, product analyst, solutions consultant, innovation lead, startup founder, business analyst, and go-to-market specialist.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Product Management | HIGAET Academy",
      description:
        "Learn AI product management: scoping, roadmaps, evaluation metrics, UX, and launch planning through HIGAET Academy practical training.",
      keywords: [
        "ai product management",
        "product roadmaps",
        "ai metrics",
        "product strategy",
        "user research",
        "ai ux",
        "experimentation",
        "product launch",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_governance_safety",
    slug: "ai-governance-and-safety",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI Governance & Safety",
    summary:
      "Learn risk assessment, policy design, and safety testing for AI systems, producing governance documentation and red-team reports through structured practical exercises.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Technology leaders",
      "Product managers",
      "Security practitioners",
      "Engineering managers",
      "IT administrators",
      "Researchers",
    ],
    prerequisites: [
      "No previous governance experience required",
      "Familiarity with AI deployments or software processes",
      "Comfort writing policies and review documentation",
    ],
    technologies: [
      "Risk registers",
      "Policy templates",
      "Red-team checklists",
      "Severity ratings",
      "Review workflows",
      "Content guidelines",
    ],
    projects: [
      "AI risk register",
      "Generative AI usage policy",
      "Red-team test report",
      "Capstone: Model release governance review package",
    ],
    skills: [
      "Risk assessment",
      "Policy design",
      "Safety testing",
      "Red-teaming",
      "Severity rating",
      "Release review",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Build AI risk registers covering misuse, bias, privacy, and operational failure modes",
      "Design usage policies and content guidelines for generative AI deployments",
      "Develop red-team test plans with documented findings and severity ratings",
      "Deploy review workflows for model releases and high-risk use cases",
      "Integrate logging and incident response procedures for AI system events",
      "Evaluate models for bias, robustness, and safety using structured checklists",
      "Secure sensitive data handling through access controls and retention rules",
      "Automate compliance evidence collection for audits and internal reviews",
    ],
    curriculum: [
      "Module 01 — Foundations: AI risk landscape, safety principles, and governance models",
      "Module 02 — Risk Assessment: threat modeling and impact classification for AI uses",
      "Module 03 — Policy Design: acceptable use, content rules, and escalation paths",
      "Module 04 — Safety Testing: red-teaming, jailbreak probes, and evaluation suites",
      "Module 05 — Operations: monitoring, incident response, and release gating",
      "Module 06 — Documentation: model cards, system cards, and audit trails",
      "Module 07 — Regulation: overview of major AI regulatory approaches and obligations",
      "Module 08 — Capstone: governance pack with risk register, policy, and safety test report",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Compliance staff, product leads, engineers, and operations managers responsible for AI oversight. Prerequisites: general familiarity with AI applications; no advanced math or coding required.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build an AI risk register, a usage policy document, and a capstone governance pack with red-team findings and an incident response plan for a sample deployment.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "AI governance analyst, trust and safety specialist, compliance associate, risk analyst, policy researcher, AI auditor, operations manager, and program coordinator.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Governance & Safety | HIGAET Academy",
      description:
        "Study AI governance and safety: risk assessment, policy design, red-teaming, and audit documentation with HIGAET Academy training.",
      keywords: [
        "ai governance",
        "ai safety",
        "risk assessment",
        "red teaming",
        "ai policy",
        "compliance",
        "trust and safety",
        "model cards",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_application_engineering",
    slug: "ai-application-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI Application Engineering",
    summary:
      "Learn to design and ship full AI applications with retrieval, tool use, and clean interfaces, building deployed prototypes through HIGAET Practical Training.",
    duration: "10 weeks",
    level: "intermediate",
    mode: "hybrid",
    audience: [
      "Software developers",
      "Frontend developers",
      "Backend developers",
      "AI engineers",
      "Career changers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Basic web backend and interface knowledge",
      "Familiarity with LLM APIs",
    ],
    technologies: [
      "LLM APIs",
      "Application backends",
      "Embedding models",
      "Vector indexes",
      "Tool calling",
      "Containers",
      "Health checks",
    ],
    projects: [
      "Full-stack AI application backend",
      "Retrieval-grounded response feature",
      "Tool-calling API integration",
      "Capstone: Deployed containerized AI application prototype",
    ],
    skills: [
      "Application design",
      "Retrieval integration",
      "Tool calling",
      "Interface design",
      "Backend development",
      "Service deployment",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build full-stack AI applications combining language models with application backends",
      "Design retrieval pipelines with chunking, embeddings, and grounded responses",
      "Develop tool-calling features that connect models to APIs and databases",
      "Deploy containerized AI services with configuration and health checks",
      "Integrate authentication, session state, and conversation memory safely",
      "Evaluate response quality with test sets and failure-case analysis",
      "Secure API keys, user data, and model inputs against common attacks",
      "Optimize latency and cost through caching, batching, and model routing",
    ],
    curriculum: [
      "Module 01 — Foundations: AI application architecture and component patterns",
      "Module 02 — Core: model integration, prompts, and structured outputs",
      "Module 03 — Retrieval: embeddings, vector stores, and grounded generation",
      "Module 04 — Engineering: tool use, function calling, and external APIs",
      "Module 05 — Interfaces: chat and task UIs with streaming and state",
      "Module 06 — Data: session memory, feedback capture, and content stores",
      "Module 07 — Production: testing, deployment, logging, and cost control",
      "Module 08 — Capstone: deployed AI application with retrieval, tools, and evaluation report",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Developers with working knowledge of JavaScript or Python, REST APIs, and Git. Familiarity with basic AI concepts helps; advanced machine learning is not required.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a retrieval-grounded assistant, a tool-using task application, and a capstone full-stack AI application deployed with documentation and an evaluation summary.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "AI application developer, full-stack developer, software engineer, solutions engineer, product engineer, backend developer, and applied AI developer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Application Engineering | HIGAET Academy",
      description:
        "Build full-stack AI apps with retrieval, tool use, and deployment skills taught step by step in HIGAET Academy experiential labs.",
      keywords: [
        "ai applications",
        "retrieval augmented generation",
        "tool calling",
        "full stack ai",
        "vector databases",
        "model integration",
        "app deployment",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_systems_engineering",
    slug: "ai-systems-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI Systems Engineering",
    summary:
      "Learn to architect scalable, observable AI platforms covering orchestration, memory, evaluation harnesses, and production operations through intensive engineering labs.",
    duration: "12 weeks",
    level: "advanced",
    mode: "hybrid",
    audience: [
      "AI engineers",
      "Backend developers",
      "Platform engineers",
      "Cloud engineers",
      "DevOps practitioners",
      "ML engineers",
    ],
    prerequisites: [
      "Comfortable with Python, APIs, and distributed services",
      "Familiarity with LLM APIs and agents",
      "Basic knowledge of load balancing and observability",
    ],
    technologies: [
      "Orchestration layers",
      "Job queues",
      "Memory stores",
      "Eval harnesses",
      "Inference topologies",
      "Load balancers",
      "Observability dashboards",
    ],
    projects: [
      "Multi-service AI platform design",
      "Agent orchestration with retries layer",
      "Evaluation harness with quality gates",
      "Capstone: Observable scalable AI platform deployment",
    ],
    skills: [
      "Systems architecture",
      "Service orchestration",
      "Memory design",
      "Evaluation harnessing",
      "Inference scaling",
      "Production operations",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Architect multi-service AI platforms with clear service and data boundaries",
      "Design orchestration layers for agents, queues, retries, and long-running jobs",
      "Develop evaluation harnesses with regression suites and quality gates",
      "Deploy scalable inference topologies with load balancing and fallbacks",
      "Integrate observability with traces, metrics, and cost attribution",
      "Evaluate scaling trade-offs across throughput, latency, and reliability targets",
      "Secure multi-tenant AI systems with isolation, quotas, and audit logging",
      "Optimize distributed AI workloads through batching, caching, and autoscaling",
    ],
    curriculum: [
      "Module 01 — Foundations: distributed AI system patterns and reference architectures",
      "Module 02 — Core: orchestration, task graphs, and stateful agent runtimes",
      "Module 03 — Memory: short-term, long-term, and shared context stores",
      "Module 04 — Engineering: inference scaling, queues, and failure handling",
      "Module 05 — Data: pipelines, feature stores, and feedback ingestion",
      "Module 06 — Advanced: evaluation platforms and continuous quality gates",
      "Module 07 — Production: observability, incident management, and cost governance",
      "Module 08 — Capstone: production-grade AI platform design with operations runbook",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Experienced backend or platform engineers comfortable with distributed systems, containers, and APIs. Prior exposure to AI application development is strongly recommended.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build an orchestration service with retries and queues, an evaluation harness with regression gates, and a capstone platform blueprint with scaling and observability plans.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "AI systems engineer, platform engineer, ML platform engineer, backend architect, infrastructure engineer, DevOps engineer, and applied AI architect.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Systems Engineering | HIGAET Academy",
      description:
        "Architect scalable AI systems: orchestration, memory, evaluation harnesses, and production operations with HIGAET Academy labs.",
      keywords: [
        "ai systems",
        "platform engineering",
        "orchestration",
        "inference scaling",
        "observability",
        "evaluation harness",
        "distributed systems",
        "mlops",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_solutions_engineering",
    slug: "ai-solutions-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI Solutions Engineering",
    summary:
      "Learn to translate client needs into working AI proposals, demos, and delivery plans, practicing scoping, estimation, and handover through applied solution exercises.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "Product managers",
      "Technology leaders",
      "Entrepreneurs",
      "AI engineers",
      "Engineering managers",
    ],
    prerequisites: [
      "Familiarity with client projects or product delivery",
      "Basic understanding of AI capabilities and data needs",
      "Comfort building demos and proposals",
    ],
    technologies: [
      "Solution templates",
      "Demo prototypes",
      "Estimation models",
      "Pilot dashboards",
      "Acceptance criteria",
      "Handover docs",
    ],
    projects: [
      "AI solution proposal package",
      "Client workflow demonstration prototype",
      "Effort and cost estimation model",
      "Capstone: Pilot solution delivery with acceptance measurement",
    ],
    skills: [
      "Needs scoping",
      "Solution design",
      "Demo building",
      "Effort estimation",
      "Pilot delivery",
      "Client handover",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build tailored AI solution proposals with scope, assumptions, and delivery milestones",
      "Design demonstration prototypes that address specific client workflows",
      "Develop estimation models covering effort, data needs, and operating cost",
      "Deploy pilot solutions with acceptance criteria and success measurement",
      "Integrate client systems through APIs, data feeds, and access controls",
      "Evaluate solution fit across accuracy, latency, cost, and maintainability",
      "Secure client confidence with risk registers and limitation statements",
      "Optimize handover packages with documentation, training, and support plans",
    ],
    curriculum: [
      "Module 01 — Foundations: solutions lifecycle from discovery to handover",
      "Module 02 — Discovery: requirements elicitation and technical qualification",
      "Module 03 — Design: solution blueprints, data mapping, and integration plans",
      "Module 04 — Engineering: rapid prototyping and demo construction",
      "Module 05 — Estimation: effort, timeline, and total cost modeling",
      "Module 06 — Delivery: pilot execution, testing, and acceptance management",
      "Module 07 — Handover: documentation, training, and support transitions",
      "Module 08 — Capstone: complete client solution pack with demo and delivery plan",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Consultants, presales engineers, and senior developers who scope client work. Prerequisites: prior AI application or integration experience plus comfort presenting technical ideas.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a discovery-to-proposal pack, a working demo for a sample client brief, and a capstone solution bundle with prototype, estimates, and handover documents.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "AI solutions engineer, solutions architect, presales engineer, technical consultant, delivery lead, integration specialist, and client success engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Solutions Engineering | HIGAET Academy",
      description:
        "Master AI solutions engineering: discovery, demos, estimation, pilot delivery, and handover through HIGAET Academy applied training.",
      keywords: [
        "ai solutions",
        "solutions architect",
        "presales engineering",
        "client delivery",
        "prototyping",
        "estimation",
        "system integration",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_multimodal_ai_engineering",
    slug: "multimodal-ai-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET Multimodal AI Engineering",
    summary:
      "Learn to build applications combining text, images, and audio using vision-language models, generation APIs, and cross-modal retrieval in hands-on engineering labs.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "AI engineers",
      "Data scientists",
      "Frontend developers",
      "Researchers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Familiarity with LLM APIs",
      "Basic media file and API handling knowledge",
    ],
    technologies: [
      "Vision-language models",
      "Image generation APIs",
      "Cross-modal indexes",
      "Transcription APIs",
      "Synthesis APIs",
      "Safety filters",
      "Audio pipelines",
    ],
    projects: [
      "Visual QA and captioning app",
      "Cross-modal text-image-audio retrieval system",
      "Controlled image generation workflow",
      "Capstone: Multimodal voice-interactive application",
    ],
    skills: [
      "Vision-language integration",
      "Cross-modal retrieval",
      "Image generation",
      "Audio transcription",
      "Voice interaction",
      "Safety filtering",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build vision-language applications for captioning, visual QA, and document understanding",
      "Design cross-modal retrieval systems spanning text, image, and audio indexes",
      "Develop image generation workflows with prompt controls and safety filters",
      "Deploy audio pipelines for transcription, synthesis, and voice interaction",
      "Integrate multimodal inputs into unified application interfaces",
      "Evaluate multimodal outputs for accuracy, grounding, and failure modes",
      "Secure media handling with consent, filtering, and storage controls",
      "Optimize multimodal latency and cost across model and modality choices",
    ],
    curriculum: [
      "Module 01 — Foundations: modality types, encoders, and fusion approaches",
      "Module 02 — Vision-Language: captioning, visual QA, and document parsing",
      "Module 03 — Generation: image synthesis controls, editing, and safety review",
      "Module 04 — Audio: speech recognition, synthesis, and voice interfaces",
      "Module 05 — Retrieval: cross-modal embeddings and unified search indexes",
      "Module 06 — Engineering: multimodal pipelines, caching, and orchestration",
      "Module 07 — Production: evaluation, moderation, and operating costs",
      "Module 08 — Capstone: multimodal application combining vision, audio, and retrieval",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Intermediate developers comfortable with Python, APIs, and basic AI application concepts. Prior work with language-model APIs is recommended before tackling multimodal pipelines.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a visual question-answering tool, a cross-modal search prototype, and a capstone multimodal application with image, audio, and text capabilities.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Multimodal AI engineer, computer vision engineer, applied AI developer, voice interface developer, media AI specialist, and product engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Multimodal AI Engineering | HIGAET Academy",
      description:
        "Build multimodal AI apps with vision-language models, image generation, audio pipelines, and cross-modal search at HIGAET Academy.",
      keywords: [
        "multimodal ai",
        "vision language models",
        "image generation",
        "speech recognition",
        "cross-modal retrieval",
        "voice interfaces",
        "computer vision",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_api_engineering",
    slug: "ai-api-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI API Engineering",
    summary:
      "Learn to design robust APIs for AI services covering streaming, authentication, rate limits, versioning, and developer experience through practical backend labs.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Cloud engineers",
      "DevOps practitioners",
      "Platform engineers",
    ],
    prerequisites: [
      "Comfortable with Python and REST API development",
      "Basic auth and versioning concepts",
      "Familiarity with streaming or backend deployment",
    ],
    technologies: [
      "REST APIs",
      "Streaming endpoints",
      "Auth systems",
      "Rate limiters",
      "Usage meters",
      "API versioning",
      "Developer portals",
    ],
    projects: [
      "Versioned language-model API",
      "Token-streaming endpoint with reconnect",
      "Key management and auth flow",
      "Capstone: Metered production AI API with quotas",
    ],
    skills: [
      "API design",
      "Streaming design",
      "Auth configuration",
      "Rate limiting",
      "Usage metering",
      "Developer experience",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Build versioned REST APIs that expose language-model and embedding services",
      "Design streaming endpoints with token events, timeouts, and reconnect handling",
      "Develop authentication and key-management flows for API consumers",
      "Deploy rate limiting, quotas, and usage metering for AI workloads",
      "Integrate validation, structured outputs, and error contracts consistently",
      "Evaluate API reliability with load tests and failure-injection exercises",
      "Secure AI endpoints against abuse, injection, and data leakage",
      "Optimize throughput and cost with batching, caching, and request routing",
    ],
    curriculum: [
      "Module 01 — Foundations: API design principles for AI services",
      "Module 02 — Core: request schemas, validation, and structured responses",
      "Module 03 — Streaming: server-sent events, websockets, and partial results",
      "Module 04 — Access: authentication, keys, scopes, and tenant isolation",
      "Module 05 — Controls: rate limits, quotas, metering, and versioning",
      "Module 06 — Quality: testing, load testing, and error handling",
      "Module 07 — Operations: logging, monitoring, and developer documentation",
      "Module 08 — Capstone: production-ready AI service API with docs and usage controls",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Backend developers familiar with HTTP, JSON, and one server framework in Python or JavaScript. Basic knowledge of AI model APIs is helpful but not mandatory.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a versioned AI service API, a streaming chat endpoint with usage metering, and a capstone documented API with auth, limits, and load-test results.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "API engineer, backend developer, platform engineer, integration engineer, software engineer, DevOps engineer, and applied AI developer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI API Engineering | HIGAET Academy",
      description:
        "Engineer production AI APIs: streaming, auth, rate limits, versioning, and docs through hands-on HIGAET Academy backend labs.",
      keywords: [
        "ai apis",
        "api design",
        "streaming endpoints",
        "authentication",
        "rate limiting",
        "versioning",
        "backend development",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_workflow_engineering",
    slug: "ai-workflow-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_ai_generative_ai",
    title: "HIGAET AI Workflow Engineering",
    summary:
      "Learn to automate everyday work with AI-connected workflows, combining triggers, approvals, and data steps into reliable routines via guided HIGAET Practical Training.",
    duration: "6 weeks",
    level: "beginner",
    mode: "online",
    audience: [
      "Operations staff",
      "Career changers",
      "Students",
      "Product managers",
      "IT administrators",
      "Entrepreneurs",
    ],
    prerequisites: [
      "No previous workflow automation experience required",
      "Comfort with everyday business tools",
      "Basic familiarity with triggers and templates",
    ],
    technologies: [
      "Workflow builders",
      "Trigger routers",
      "Approval gates",
      "Template libraries",
      "Schedulers",
      "Error notifiers",
      "Business connectors",
    ],
    projects: [
      "Trigger-based business routine",
      "Content and reporting template set",
      "Approval-gated workflow",
      "Capstone: Scheduled event-driven workflow system",
    ],
    skills: [
      "Workflow design",
      "Trigger configuration",
      "Branch logic",
      "Template reuse",
      "Error handling",
      "Routine deployment",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Build automated workflows that connect AI steps to everyday business tools",
      "Design trigger-based routines with filters, branches, and approval gates",
      "Develop reusable templates for content, support, and reporting tasks",
      "Deploy scheduled and event-driven workflows with error notifications",
      "Integrate spreadsheets, documents, email, and chat tools into flows",
      "Evaluate workflow runs using logs, success rates, and correction reviews",
      "Secure workflow credentials and restrict sensitive actions with approvals",
      "Automate routine reporting pipelines with checks and human review points",
    ],
    curriculum: [
      "Module 01 — Foundations: workflow concepts, triggers, actions, and data flow",
      "Module 02 — Core: connecting AI steps to documents, sheets, and messaging",
      "Module 03 — Logic: branching, filters, loops, and approval patterns",
      "Module 04 — Reliability: error handling, retries, and run monitoring",
      "Module 05 — Templates: reusable workflows for support and reporting tasks",
      "Module 06 — Governance: access control, audit logs, and safe automation",
      "Module 07 — Scaling: scheduling, batch runs, and maintenance practices",
      "Module 08 — Capstone: automated departmental workflow with docs and review gates",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Beginners, operations staff, and non-engineers who want practical automation skills. Prerequisites: comfort with spreadsheets and web apps; no programming experience required.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a content-drafting workflow, a support-triage routine with approvals, and a capstone automated reporting flow with logging and human review steps.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Automation specialist, operations associate, workflow analyst, virtual assistant, office administrator, support specialist, and junior no-code developer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Workflow Engineering | HIGAET Academy",
      description:
        "Learn AI workflow automation: triggers, approvals, tool connections, and reliable routines for teams with HIGAET Academy labs.",
      keywords: [
        "ai workflows",
        "workflow automation",
        "no-code automation",
        "business process",
        "ai triggers",
        "approvals",
        "productivity",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_full_stack_engineering",
    slug: "full-stack-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET Full Stack Engineering",
    summary:
      "Study full-stack web development end to end, from semantic interfaces and APIs to databases, testing, security basics, observability, and cloud deployment.",
    duration: "16 weeks",
    level: "beginner",
    mode: "hybrid",
    audience: [
      "Students",
      "Career changers",
      "Software developers",
      "Frontend developers",
      "Backend developers",
      "Entrepreneurs",
    ],
    prerequisites: [
      "Basic programming concepts in any language",
      "Familiarity with HTML and CSS fundamentals",
      "Comfort using the command line and Git",
      "No previous cloud deployment experience required",
    ],
    technologies: [
      "Semantic HTML",
      "Modern CSS",
      "TypeScript",
      "REST APIs",
      "Relational databases",
      "Cloud hosting",
      "Environment configuration",
      "Observability tooling",
    ],
    projects: [
      "Responsive semantic interface with TypeScript",
      "Versioned RESTful endpoint with validation",
      "Database-backed application with migrations",
      "Secure observable full-stack application",
      "Capstone: Cloud-deployed full-stack web application",
    ],
    skills: [
      "Responsive interface development",
      "RESTful endpoint design",
      "Relational data modeling",
      "Database migrations",
      "Security basics",
      "Testing practices",
      "Cloud deployment",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build responsive web interfaces with semantic HTML, modern CSS, and TypeScript.",
      "Design RESTful endpoints with clear versioning, validation, and error handling.",
      "Develop database-backed applications with relational modeling and migrations.",
      "Deploy full-stack applications to cloud hosting with environment configuration.",
      "Integrate third-party services for authentication, storage, and email delivery.",
      "Evaluate application performance using browser tools and server-side metrics.",
      "Secure web applications with authentication, authorization, and input validation.",
      "Automate testing and delivery with unit tests, integration tests, and pipelines.",
    ],
    curriculum: [
      "Module 01 — Foundations of the Web and Developer Tooling",
      "Module 02 — Semantic HTML and Modern CSS Systems",
      "Module 03 — TypeScript and Interactive Frontend Development",
      "Module 04 — React Components, State, and Data Fetching",
      "Module 05 — Backend Foundations with HTTP and Databases",
      "Module 06 — Authentication, Authorization, and File Handling",
      "Module 07 — Testing, Debugging, and Performance Habits",
      "Module 08 — Deployment, Observability, and Production Readiness",
      "Module 09 — Capstone: Plan, Build, and Deploy a Full-Stack Application",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "This beginner course suits learners with basic computer skills and an interest in websites. Familiarity with any programming concepts helps, but core HTML, CSS, and JavaScript are taught from the start.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will build styled pages, interactive frontend apps, REST APIs, and database-backed features. The capstone combines them into one deployed full-stack application with documentation and tests.",
      },
      {
        question: "What roles does this course relate to?",
        answer:
          "The skills covered relate to roles such as frontend developer, backend developer, full-stack developer, web developer, QA engineer, support engineer, and freelance web developer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Full Stack Engineering | HIGAET Academy",
      description:
        "Learn full-stack web engineering across frontend, APIs, databases, testing, security basics, and deployment in a 16-week hybrid program with projects.",
      keywords: [
        "full stack development",
        "frontend basics",
        "backend basics",
        "rest api course",
        "database design",
        "react course",
        "web deployment",
        "software testing basics",
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
    id: "academy_course_frontend_engineering",
    slug: "frontend-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET Frontend Engineering",
    summary:
      "Study modern frontend development with semantic HTML, CSS systems, TypeScript, and React, including testing, accessibility, routing, and daily performance habits.",
    duration: "10 weeks",
    level: "beginner",
    mode: "online",
    audience: [
      "Students",
      "Career changers",
      "Software developers",
      "Frontend developers",
      "Product managers",
      "Entrepreneurs",
    ],
    prerequisites: [
      "Basic HTML, CSS, and JavaScript knowledge",
      "Familiarity with the command line and Git",
      "No previous React experience required",
    ],
    technologies: [
      "Semantic HTML",
      "Modern CSS",
      "TypeScript",
      "React",
      "Client-side routing",
      "Accessibility testing",
      "Preview environments",
      "Frontend hosting",
    ],
    projects: [
      "Accessible multi-page layout with modern CSS",
      "Reusable themed component library",
      "Interactive routed React application with client-side state",
      "Capstone: Deployed frontend site with previews and rollbacks",
    ],
    skills: [
      "Accessible page layouts",
      "Component library design",
      "React application development",
      "Client-side routing",
      "Frontend testing",
      "Performance habits",
      "Deployment with rollbacks",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build accessible page layouts with semantic HTML and modern CSS techniques.",
      "Design reusable component libraries with consistent props, slots, and theming.",
      "Develop interactive React applications with routing and client-side state.",
      "Deploy static and frontend-hosted sites with preview environments and rollbacks.",
      "Integrate REST APIs with loading, error, empty, and pagination states.",
      "Evaluate interface performance with audits, bundle analysis, and image strategy.",
      "Secure frontend applications against cross-site scripting and unsafe rendering.",
      "Automate visual checks and unit tests for components and user flows.",
    ],
    curriculum: [
      "Module 01 — Foundations of Browsers, HTML, and CSS",
      "Module 02 — Responsive Layouts and Design Systems",
      "Module 03 — JavaScript and TypeScript for Interfaces",
      "Module 04 — React Components, Hooks, and State",
      "Module 05 — Routing, Forms, and API Integration",
      "Module 06 — Accessibility, Internationalization, and SEO Basics",
      "Module 07 — Testing, Performance, and Production Builds",
      "Module 08 — Capstone: Design, Build, and Ship a Polished Frontend App",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "This beginner course suits learners comfortable with computers and basic problem solving. No prior framework experience is needed; HTML, CSS, and JavaScript fundamentals are covered before React.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will build landing pages, a design-system component set, and data-driven React screens. The capstone is a complete accessible frontend application connected to a public API.",
      },
      {
        question: "What roles does this course relate to?",
        answer:
          "The skills covered relate to roles such as frontend developer, UI developer, web developer, design engineer, QA engineer, content developer, and freelance web designer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Frontend Engineering | HIGAET Academy",
      description:
        "Learn modern frontend engineering with HTML, CSS, TypeScript, and React in a 10-week online program focused on accessible, tested, responsive interfaces.",
      keywords: [
        "frontend development",
        "html css course",
        "typescript basics",
        "react course",
        "responsive design",
        "web accessibility",
        "frontend testing",
        "ui components",
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
    id: "academy_course_backend_engineering",
    slug: "backend-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET Backend Engineering",
    summary:
      "Study reliable server-side engineering with structured data modeling, HTTP APIs, authentication, background jobs, caching, testing, observability, logging, and deployment practices.",
    duration: "12 weeks",
    level: "intermediate",
    mode: "hybrid",
    audience: [
      "Software developers",
      "Backend developers",
      "Cloud engineers",
      "DevOps practitioners",
      "Platform engineers",
      "Engineering managers",
    ],
    prerequisites: [
      "Comfortable with a server-side programming language",
      "Basic SQL and relational database concepts",
      "Familiarity with HTTP and Git workflows",
    ],
    technologies: [
      "HTTP services",
      "Routing middleware",
      "Relational schemas",
      "Authentication tokens",
      "Background jobs",
      "Caching",
      "Structured logging",
      "Health checks",
    ],
    projects: [
      "Validated HTTP service with structured logging",
      "Relational schema with indexes and migrations",
      "Authenticated role-based API",
      "Capstone: Deployed backend service with health checks and backups",
    ],
    skills: [
      "HTTP service construction",
      "Relational schema design",
      "Authenticated API development",
      "Background job processing",
      "Caching strategies",
      "Testing practices",
      "Observability and logging",
      "Service deployment",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build HTTP services with routing, middleware, validation, and structured logging.",
      "Design relational schemas with constraints, indexes, transactions, and migrations.",
      "Develop authenticated APIs with sessions, tokens, roles, and permission checks.",
      "Deploy backend services with configuration, health checks, and database backups.",
      "Integrate message queues and background workers for long-running tasks.",
      "Evaluate query and endpoint performance with profiling and caching strategy.",
      "Secure backend systems with hashing, rate limiting, and secrets management.",
      "Automate API and data-layer tests across unit, integration, and contract levels.",
    ],
    curriculum: [
      "Module 01 — Foundations of HTTP, Servers, and Tooling",
      "Module 02 — Data Modeling with Relational Databases",
      "Module 03 — API Construction with Validation and Errors",
      "Module 04 — Authentication, Sessions, and Permissions",
      "Module 05 — Background Jobs, Queues, and Scheduled Tasks",
      "Module 06 — Caching, Pagination, and Performance Tuning",
      "Module 07 — Testing, Logging, and Production Operations",
      "Module 08 — Capstone: Design, Build, and Operate a Backend Service",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "This intermediate course suits learners who can write basic code in any language. Comfort with variables, functions, and command-line basics helps before tackling databases and APIs.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will build database schemas, REST endpoints, auth flows, and background workers. The capstone is a production-style backend service with tests, logs, and deployment notes.",
      },
      {
        question: "What roles does this course relate to?",
        answer:
          "The skills covered relate to roles such as backend developer, API developer, database developer, platform engineer, DevOps associate, QA automation engineer, and support engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Backend Engineering | HIGAET Academy",
      description:
        "Learn backend engineering with HTTP APIs, relational data modeling, queues, caching, auth, and testing in a 12-week hybrid program with reviews.",
      keywords: [
        "backend development",
        "server side programming",
        "database design",
        "rest api development",
        "authentication systems",
        "message queues",
        "caching strategies",
        "backend testing",
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
    id: "academy_course_api_engineering",
    slug: "api-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET API Engineering",
    summary:
      "Study practical API engineering with careful REST and GraphQL design, versioning, authentication, validation, testing, documentation, rate limiting, and operational controls.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Frontend developers",
      "Platform engineers",
      "Product managers",
      "Engineering managers",
    ],
    prerequisites: [
      "Comfortable with HTTP fundamentals and JSON",
      "Basic programming experience consuming APIs",
      "Familiarity with Git and command-line tools",
    ],
    technologies: [
      "REST APIs",
      "GraphQL schemas",
      "API versioning",
      "Authentication controls",
      "Contract testing",
      "Mock servers",
      "API documentation",
      "Rate limiting",
    ],
    projects: [
      "Versioned REST API with pagination and error contracts",
      "GraphQL schema with resolvers and query budgets",
      "Contract test suite with mock servers",
      "Capstone: Documented staged API with backward-compatible release",
    ],
    skills: [
      "REST design",
      "GraphQL schema design",
      "API versioning",
      "Validation and error handling",
      "Contract testing",
      "Documentation practices",
      "Operational controls",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build versioned REST APIs with pagination, filtering, sorting, and error contracts.",
      "Design GraphQL schemas with types, resolvers, mutations, and query budgets.",
      "Develop contract tests and mock servers that keep clients and servers aligned.",
      "Deploy documented APIs with staging environments and backward-compatible releases.",
      "Integrate OAuth flows, API keys, and webhook receivers into client systems.",
      "Evaluate API reliability with latency budgets, tracing, and usage dashboards.",
      "Secure APIs with scopes, rotation policies, validation, and abuse controls.",
      "Automate linting, breaking-change detection, and client SDK generation.",
    ],
    curriculum: [
      "Module 01 — Foundations of APIs and Interface Contracts",
      "Module 02 — REST Resource Modeling and Versioning",
      "Module 03 — GraphQL Schemas, Resolvers, and Mutations",
      "Module 04 — Authentication, Authorization, and Webhooks",
      "Module 05 — Validation, Errors, Pagination, and Rate Limits",
      "Module 06 — Testing, Mocking, and Client Integration",
      "Module 07 — Documentation, SDKs, and Release Operations",
      "Module 08 — Capstone: Design, Document, and Deliver a Versioned API",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "This intermediate course suits developers who can build basic HTTP handlers or frontend fetch calls. Familiarity with JSON and one programming language is enough to follow the design exercises.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will build REST resources, a GraphQL service, webhook handlers, and OpenAPI documents. The capstone is a versioned API with guides, examples, tests, and a migration note.",
      },
      {
        question: "What roles does this course relate to?",
        answer:
          "The skills covered relate to roles such as API developer, backend developer, integration engineer, platform engineer, solutions engineer, QA engineer, and technical writer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "API Engineering | HIGAET Academy",
      description:
        "Learn REST and GraphQL API design, versioning, security, validation, testing, and operations in an 8-week online program with guided reviews.",
      keywords: [
        "api design course",
        "rest api",
        "graphql course",
        "openapi documentation",
        "api security",
        "webhooks",
        "api testing",
        "integration engineering",
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
    id: "academy_course_system_design",
    slug: "system-design",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET System Design",
    summary:
      "Study how large systems scale, from load balancing and caching to queues, sharding, replication, consistency models, failure handling, and consensus protocols.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Cloud engineers",
      "Platform engineers",
      "Engineering managers",
      "Technology leaders",
    ],
    prerequisites: [
      "Experience building or operating backend services",
      "Understanding of HTTP, databases, and caching basics",
      "Comfort with traffic and capacity estimation math",
    ],
    technologies: [
      "Load balancing",
      "Cache hierarchies",
      "Message queues",
      "Database sharding",
      "Replication",
      "Consistency models",
      "Consensus protocols",
      "Multi-region failover",
    ],
    projects: [
      "Capacity model linking traffic to servers and storage",
      "Cache hierarchy with eviction and invalidation",
      "Queue-based workflow with retries and dead letters",
      "Capstone: Multi-region read design with replication and failover plan",
    ],
    skills: [
      "Capacity modeling",
      "Cache hierarchy design",
      "Queue-based workflows",
      "Sharding and replication",
      "Consistency trade-offs",
      "Failure handling",
      "Consensus reasoning",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build capacity models that connect traffic estimates to servers, storage, and bandwidth.",
      "Design cache hierarchies with eviction, invalidation, and consistency trade-offs.",
      "Develop queue-based workflows with retries, dead letters, and ordering guarantees.",
      "Deploy multi-region read patterns with replication lag and failover planning.",
      "Integrate sharding and partitioning strategies for hot keys and uneven growth.",
      "Evaluate CAP and PACELC trade-offs for session, catalog, and payment workloads.",
      "Secure distributed communication with mutual TLS, idempotency, and audit trails.",
      "Optimize consensus-dependent paths using leader election and quorum reasoning.",
    ],
    curriculum: [
      "Module 01 — Foundations of Scale, Latency, and Availability",
      "Module 02 — Load Balancing, Caching, and Content Delivery",
      "Module 03 — Queues, Streams, and Asynchronous Workflows",
      "Module 04 — Sharding, Partitioning, and Replication",
      "Module 05 — CAP, Consistency Models, and Consensus",
      "Module 06 — Storage Selection and Data Lifecycle Design",
      "Module 07 — Observability, Failure Drills, and Cost Control",
      "Module 08 — Capstone: Present and Defend a Scalable System Design",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "This advanced course suits developers comfortable with APIs, databases, and deployment basics. Experience reading architecture diagrams and reasoning about latency helps with the weekly design drills.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will produce estimation sheets, architecture diagrams, and failure-mode reviews for services like feeds and checkouts. The capstone is a defended design document with trade-offs and scaling math.",
      },
      {
        question: "What roles does this course relate to?",
        answer:
          "The skills covered relate to roles such as backend engineer, platform engineer, site reliability engineer, solutions architect, infrastructure engineer, data engineer, and engineering manager.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "System Design | HIGAET Academy",
      description:
        "Learn distributed system design covering scaling, CAP trade-offs, caching, queues, sharding, replication, and consensus in an advanced online program.",
      keywords: [
        "system design course",
        "distributed systems",
        "scalability patterns",
        "caching and cdn",
        "message queues",
        "database sharding",
        "cap theorem",
        "consensus protocols",
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
    id: "academy_course_software_architecture",
    slug: "software-architecture",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET Software Architecture",
    summary:
      "Study designing durable and practical software architecture through clear components, boundaries, quality attributes, patterns, documentation, governance, trade-off records, and evolutionary design.",
    duration: "10 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Engineering managers",
      "Technology leaders",
      "Platform engineers",
      "Researchers",
    ],
    prerequisites: [
      "Experience shipping software in a team setting",
      "Familiarity with components, services, and databases",
      "Comfort reading design documents and diagrams",
    ],
    technologies: [
      "Modular monoliths",
      "Domain modeling",
      "Context mapping",
      "Architecture decision records",
      "Quality attributes",
      "Fitness functions",
      "Governance practices",
      "Evolutionary design",
    ],
    projects: [
      "Modular monolith with dependency rules",
      "Service boundary design with context mapping",
      "Architecture decision record portfolio",
      "Capstone: Evolvable system plan with fitness functions and modernization stages",
    ],
    skills: [
      "Component boundary design",
      "Domain modeling",
      "Pattern selection",
      "Architecture documentation",
      "Trade-off analysis",
      "Governance practices",
      "Evolutionary design",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build modular monoliths with explicit module boundaries and dependency rules.",
      "Design service boundaries using domain modeling and context-mapping techniques.",
      "Develop architecture decision records that capture context, options, and consequences.",
      "Deploy evolvable systems with fitness functions and staged modernization plans.",
      "Integrate event-driven patterns with schemas, versioning, and consumer contracts.",
      "Evaluate quality attributes such as maintainability, testability, and operability.",
      "Secure architecture reviews with threat modeling and data-flow analysis.",
      "Automate governance with lint rules, contract checks, and diagram validation.",
    ],
    curriculum: [
      "Module 01 — Foundations of Architecture and Quality Attributes",
      "Module 02 — Components, Modules, and Dependency Discipline",
      "Module 03 — Domain Boundaries and Context Mapping",
      "Module 04 — Architectural Styles from Monolith to Services",
      "Module 05 — Events, Contracts, and Integration Patterns",
      "Module 06 — Data Ownership, Transactions, and Reporting",
      "Module 07 — Documentation, Reviews, and Governance Habits",
      "Module 08 — Capstone: Document and Present an Evolutionary Architecture",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "This advanced course suits developers who have shipped multi-module code or maintained production services. Comfort with APIs, data stores, and code reviews helps with the architecture exercises.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will build context maps, decision records, interface contracts, and migration plans. The capstone is a documented architecture proposal with diagrams, risks, and an evolution roadmap.",
      },
      {
        question: "What roles does this course relate to?",
        answer:
          "The skills covered relate to roles such as software architect, senior backend engineer, platform engineer, staff engineer, engineering manager, solutions architect, and consultant.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Software Architecture | HIGAET Academy",
      description:
        "Learn pragmatic software architecture with components, boundaries, quality attributes, documentation, and evolution in a 10-week advanced online program.",
      keywords: [
        "software architecture",
        "system architecture",
        "domain driven design",
        "microservices patterns",
        "event driven architecture",
        "architecture documentation",
        "quality attributes",
        "technical leadership",
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
    id: "academy_course_software_engineering",
    slug: "software-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET Software Engineering",
    summary:
      "Learn software engineering foundations through version control, testing, design patterns, and collaborative workflows, progressing from programming fundamentals to shipping a tested team-built release.",
    duration: "12 weeks",
    level: "beginner",
    mode: "hybrid",
    audience: [
      "Students",
      "Career changers",
      "Software developers",
      "Product managers",
      "Operations staff",
      "IT administrators",
    ],
    prerequisites: [
      "No previous software engineering experience required",
      "Basic computer literacy and file management",
      "Willingness to learn collaborative Git workflows",
    ],
    technologies: [
      "Programming fundamentals",
      "Version control",
      "Branching workflows",
      "Testing frameworks",
      "Design patterns",
      "Code review tooling",
      "Command-line programs",
      "Team release practices",
    ],
    projects: [
      "Tested command-line program with modules",
      "Clean-code refactor with documented interfaces",
      "Version-controlled team project with pull requests",
      "Capstone: Tested team-built release with collaborative workflow",
    ],
    skills: [
      "Programming fundamentals",
      "Clean code practices",
      "Version control",
      "Testing habits",
      "Design pattern application",
      "Code review collaboration",
      "Team release workflows",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build tested command-line and small web programs using control flow, functions, and modules.",
      "Design clean code with readable structure, naming conventions, and documented interfaces.",
      "Develop version-controlled projects with branching, pull requests, and code review habits.",
      "Evaluate software designs using common patterns, trade-offs, and maintainability criteria.",
      "Integrate automated unit tests and debugging workflows into everyday development practice.",
      "Secure applications with input validation, safe defaults, and responsible secret handling.",
      "Automate builds, formatting, and checks with simple continuous integration pipelines.",
      "Deploy a tested team release with documentation, issue tracking, and a demo walkthrough.",
    ],
    curriculum: [
      "Module 01: Foundations of Software Engineering and Developer Tooling",
      "Module 02: Programming Fundamentals and Problem Decomposition",
      "Module 03: Version Control, Branching, and Collaborative Workflows",
      "Module 04: Data Structures, Algorithms, and Code Design Patterns",
      "Module 05: Testing, Debugging, and Code Quality Practices",
      "Module 06: Databases, APIs, and Application Architecture Basics",
      "Module 07: Production Practices, CI Pipelines, and Release Management",
      "Module 08: Capstone: Plan, Build, Test, and Deploy a Team Software Release",
    ],
    faqs: [
      {
        question: "Who is this course for and are there prerequisites?",
        answer:
          "It suits beginners with basic computer skills and an interest in programming. Familiarity with any programming language helps, but core concepts are taught from the foundations with guided practice.",
      },
      {
        question: "What will I build during the course including the capstone?",
        answer:
          "You will build tested programs, a version-controlled team project, automated checks, and a documented release. The capstone is a team-built software release with tests, documentation, and a demo.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Relevant roles include software engineer, application support engineer, QA engineer, junior backend developer, junior frontend developer, tools engineer, and release coordinator.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Software Engineering | HIGAET Academy",
      description:
        "A 12-week hybrid software engineering course covering design, testing, collaboration, and release practices with a team-built capstone project.",
      keywords: [
        "software engineering course",
        "programming fundamentals",
        "version control",
        "software testing",
        "code review",
        "design patterns",
        "ci pipelines",
        "software release practices",
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
    id: "academy_course_application_engineering",
    slug: "application-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET Application Engineering",
    summary:
      "Design and deliver production application features across backend services, data models, and user interfaces, applying testing, debugging, and release practices on realistic projects.",
    duration: "10 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Students",
      "Career changers",
      "Software developers",
      "Frontend developers",
      "Backend developers",
      "Product managers",
    ],
    prerequisites: [
      "Basic programming and web fundamentals",
      "Familiarity with APIs and data models",
      "Comfort with Git and debugging tools",
    ],
    technologies: [
      "Backend services",
      "Data models",
      "User interfaces",
      "API validation",
      "Paginated data access",
      "Application state",
      "Testing practices",
      "Release practices",
    ],
    projects: [
      "Layered application feature across interface, service, and data",
      "Validated backend endpoints with paginated access",
      "Interactive state-managed interface consuming APIs",
      "Capstone: Production application feature with testing and release practices",
    ],
    skills: [
      "Layered feature architecture",
      "Backend endpoint development",
      "Data modeling",
      "Interactive interface development",
      "API consumption",
      "Debugging practices",
      "Testing and release practices",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Architect layered application features spanning interfaces, services, and data models.",
      "Build backend endpoints with validation, error handling, and paginated data access.",
      "Develop interactive user interfaces that consume APIs and manage application state.",
      "Integrate authentication, sessions, and role-based access into application workflows.",
      "Evaluate application performance, queries, and caching strategies under realistic load.",
      "Secure application endpoints against common input, access, and session risks.",
      "Automate application test suites covering units, integration paths, and regressions.",
      "Deploy versioned application releases with environment configuration and rollback plans.",
    ],
    curriculum: [
      "Module 01: Foundations of Application Architecture and Project Setup",
      "Module 02: Data Modeling, Migrations, and Query Design",
      "Module 03: Backend Services, Routing, and Validation",
      "Module 04: Authentication, Sessions, and Access Control",
      "Module 05: Frontend State, Forms, and API Integration",
      "Module 06: Testing, Debugging, and Performance Tuning",
      "Module 07: Production Readiness, Configuration, and Deployment Pipelines",
      "Module 08: Capstone: Design, Build, and Deploy a Full Application Feature Set",
    ],
    faqs: [
      {
        question: "Who is this course for and are there prerequisites?",
        answer:
          "It suits learners with basic programming and web fundamentals. Comfort with one language, simple APIs, and databases will help you follow the backend and interface modules.",
      },
      {
        question: "What will I build during the course including the capstone?",
        answer:
          "You will build validated endpoints, data models, authenticated workflows, and connected interfaces. The capstone is a deployed application feature set with tests and release notes.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Relevant roles include application engineer, backend developer, frontend developer, full-stack developer, API developer, QA automation engineer, and release engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Application Engineering | HIGAET Academy",
      description:
        "A 10-week online application engineering course covering backend services, data models, interfaces, testing, and release workflows in depth.",
      keywords: [
        "application engineering course",
        "backend services",
        "api development",
        "data modeling",
        "frontend integration",
        "authentication",
        "application testing",
        "deployment pipelines",
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
    id: "academy_course_web_engineering",
    slug: "web-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET Web Engineering",
    summary:
      "Build modern web applications with semantic HTML, responsive CSS, and interactive JavaScript, covering routing, forms, APIs, accessibility, and deployment fundamentals.",
    duration: "8 weeks",
    level: "beginner",
    mode: "online",
    audience: [
      "Students",
      "Career changers",
      "Software developers",
      "Frontend developers",
      "Product managers",
      "Entrepreneurs",
    ],
    prerequisites: [
      "No previous web development experience required",
      "Basic computer literacy and text-editor use",
      "Willingness to learn JavaScript fundamentals",
    ],
    technologies: [
      "Semantic HTML",
      "Responsive CSS",
      "Interactive JavaScript",
      "Client-side routing",
      "Form validation",
      "Accessibility practices",
      "Web APIs",
      "Static deployment",
    ],
    projects: [
      "Responsive page with semantic markup and reusable styles",
      "Interactive browser behavior with events and form validation",
      "Accessible routed web application consuming APIs",
      "Capstone: Deployed accessible web application with routing and forms",
    ],
    skills: [
      "Semantic markup",
      "Responsive layouts",
      "Interactive browser behavior",
      "Form validation",
      "Accessible interface design",
      "API integration",
      "Deployment fundamentals",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build responsive pages with semantic markup, modern layouts, and reusable styles.",
      "Develop interactive browser behavior with events, state, and form validation.",
      "Design accessible interfaces with keyboard support, contrast, and screen-reader labels.",
      "Integrate public and custom APIs for data fetching, error states, and loading flows.",
      "Evaluate page performance using loading, rendering, and asset-size techniques.",
      "Secure browser forms with validation, safe storage, and cross-site scripting awareness.",
      "Optimize media, fonts, and bundles for faster and more reliable page loads.",
      "Deploy a live multi-page site with routing, forms, and production hosting setup.",
    ],
    curriculum: [
      "Module 01: Foundations of the Web, Browsers, and Developer Tools",
      "Module 02: Semantic HTML, Forms, and Content Structure",
      "Module 03: Responsive CSS, Layout Systems, and Design Tokens",
      "Module 04: JavaScript Essentials, DOM Events, and Application State",
      "Module 05: Routing, Data Fetching, and API-Driven Pages",
      "Module 06: Accessibility, Performance, and Browser Compatibility",
      "Module 07: Production Builds, Hosting, and Deployment Workflows",
      "Module 08: Capstone: Build and Deploy an Accessible Multi-Page Web Application",
    ],
    faqs: [
      {
        question: "Who is this course for and are there prerequisites?",
        answer:
          "It suits beginners with basic computer literacy and no prior web experience. General comfort with files, browsers, and text editors is enough to start the foundations modules.",
      },
      {
        question: "What will I build during the course including the capstone?",
        answer:
          "You will build responsive pages, validated forms, API-driven views, and optimized assets. The capstone is a deployed multi-page web application with routing and accessible design.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Relevant roles include frontend developer, web developer, UI developer, web content engineer, junior full-stack developer, and website maintenance specialist.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Web Engineering | HIGAET Academy",
      description:
        "An 8-week online web engineering course covering modern HTML, CSS, JavaScript, routing, forms, APIs, accessibility, and deployment fundamentals.",
      keywords: [
        "web engineering course",
        "html css javascript",
        "responsive design",
        "frontend development",
        "web accessibility",
        "api integration",
        "web performance",
        "website deployment",
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
    id: "academy_course_distributed_systems_engineering",
    slug: "distributed-systems-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET Distributed Systems Engineering",
    summary:
      "Study consistency, replication, partitioning, consensus, and fault tolerance while building resilient services that handle failure, scaling, and coordination across nodes.",
    duration: "10 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Cloud engineers",
      "Platform engineers",
      "DevOps practitioners",
      "Engineering managers",
    ],
    prerequisites: [
      "Experience with backend services and databases",
      "Understanding of networks, transactions, and APIs",
      "Comfort with failure modes and scaling concepts",
    ],
    technologies: [
      "Partitioning",
      "Replication",
      "Consensus protocols",
      "Leader election",
      "Fault tolerance",
      "Consistency models",
      "Isolation levels",
      "Coordination services",
    ],
    projects: [
      "Partitioned service with availability and latency trade-offs",
      "Replicated data flow with conflict handling and repair",
      "Consensus-driven coordination for locks and configuration",
      "Capstone: Resilient distributed service with fault tolerance and scaling",
    ],
    skills: [
      "Partitioning strategies",
      "Replication design",
      "Consistency modeling",
      "Consensus coordination",
      "Fault-tolerant design",
      "Transaction isolation analysis",
      "Scaling coordination",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Architect partitioned services with clear consistency, availability, and latency trade-offs.",
      "Build replicated data flows with conflict handling, versioning, and repair strategies.",
      "Develop consensus-driven coordination for leader election, locks, and configuration changes.",
      "Evaluate consistency models and isolation levels for transactions across nodes.",
      "Integrate retries, timeouts, idempotency, and backpressure into service communication.",
      "Secure inter-service traffic with mutual authentication, encryption, and policy controls.",
      "Automate chaos, failure-injection, and recovery drills to validate resilience assumptions.",
      "Deploy observable multi-node services with health checks, load balancing, and failover.",
    ],
    curriculum: [
      "Module 01: Foundations of Distributed Systems, Clocks, and Failure Models",
      "Module 02: Networking, RPC Design, and Messaging Guarantees",
      "Module 03: Replication, Consistency Models, and Conflict Resolution",
      "Module 04: Partitioning, Sharding, and Distributed Storage Design",
      "Module 05: Consensus, Leader Election, and Distributed Coordination",
      "Module 06: Transactions, Isolation, and Exactly-Once Processing Patterns",
      "Module 07: Fault Tolerance, Load Balancing, and Production Operations",
      "Module 08: Capstone: Design, Deploy, and Test a Fault-Tolerant Multi-Node Service",
    ],
    faqs: [
      {
        question: "Who is this course for and are there prerequisites?",
        answer:
          "It suits experienced developers comfortable with backend services, networking basics, and databases. Prior work with APIs, concurrency, and production deployments will help with the advanced modules.",
      },
      {
        question: "What will I build during the course including the capstone?",
        answer:
          "You will build replicated stores, partitioned services, consensus coordination labs, and resilience tests. The capstone is a deployed multi-node service validated under injected failures.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Relevant roles include distributed systems engineer, backend engineer, platform engineer, site reliability engineer, infrastructure engineer, database engineer, and cloud engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Distributed Systems Engineering | HIGAET Academy",
      description:
        "A 10-week online distributed systems course covering consistency, replication, partitioning, consensus, and resilient fault-tolerant service design.",
      keywords: [
        "distributed systems course",
        "consistency models",
        "replication",
        "partitioning",
        "consensus algorithms",
        "fault tolerance",
        "distributed transactions",
        "systems reliability",
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
    id: "academy_course_microservices_engineering",
    slug: "microservices-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_software_engineering",
    title: "HIGAET Microservices Engineering",
    summary:
      "Practice service decomposition, API contracts, saga transactions, service mesh routing, and observability while building independently deployable services with resilient communication.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Cloud engineers",
      "DevOps practitioners",
      "Platform engineers",
      "Engineering managers",
    ],
    prerequisites: [
      "Experience building backend APIs and services",
      "Familiarity with REST contracts and databases",
      "Comfort with deployment and observability basics",
    ],
    technologies: [
      "Service decomposition",
      "API contracts",
      "Schema validation",
      "Saga transactions",
      "Service mesh routing",
      "Circuit breaking",
      "Observability tooling",
      "Independent deployment",
    ],
    projects: [
      "Domain-decomposed service boundaries with ownership analysis",
      "Versioned API contracts with compatibility checks",
      "Saga workflow with compensation logic",
      "Capstone: Independently deployable mesh-routed services with resilient communication",
    ],
    skills: [
      "Service boundary design",
      "Contract versioning",
      "Saga transaction design",
      "Mesh-routed communication",
      "Resilience patterns",
      "Observability practices",
      "Independent deployment",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Architect service boundaries using domain decomposition, ownership, and coupling analysis.",
      "Design versioned API contracts with schema validation, compatibility, and documentation.",
      "Build saga-based transactions with compensation logic for multi-service workflows.",
      "Develop mesh-routed services with traffic policies, retries, and circuit breaking.",
      "Integrate centralized logging, metrics, and distributed tracing across services.",
      "Secure service identities, tokens, and inter-service authorization policies.",
      "Automate service pipelines with contract tests, canary releases, and safe rollbacks.",
      "Deploy an observable service set with gateways, discovery, and health management.",
    ],
    curriculum: [
      "Module 01: Foundations of Microservices, Domains, and Service Boundaries",
      "Module 02: Decomposition Patterns, Contracts, and API Versioning",
      "Module 03: Data Ownership, Sagas, and Event-Driven Communication",
      "Module 04: Service Mesh, Gateways, and Resilient Routing",
      "Module 05: Observability with Metrics, Logs, and Distributed Tracing",
      "Module 06: Security, Identity, and Policy Across Services",
      "Module 07: Production Delivery with Testing, Canaries, and Rollbacks",
      "Module 08: Capstone: Decompose, Deploy, and Operate an Observable Service Suite",
    ],
    faqs: [
      {
        question: "Who is this course for and are there prerequisites?",
        answer:
          "It suits backend or platform developers familiar with APIs, containers, and deployments. Experience with one backend framework and basic distributed concepts will help with the advanced labs.",
      },
      {
        question: "What will I build during the course including the capstone?",
        answer:
          "You will build versioned contracts, saga workflows, mesh-routed services, and tracing dashboards. The capstone is a deployed suite of observable services with gateway routing and canary releases.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Relevant roles include microservices developer, backend engineer, platform engineer, API engineer, site reliability engineer, integration engineer, and cloud application engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Microservices Engineering | HIGAET Academy",
      description:
        "An 8-week online microservices engineering course covering decomposition, contracts, sagas, service mesh routing, and observability practices.",
      keywords: [
        "microservices course",
        "service decomposition",
        "api contracts",
        "saga pattern",
        "service mesh",
        "distributed tracing",
        "event driven services",
        "canary releases",
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
    id: "academy_course_cloud_engineering",
    slug: "cloud-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET Cloud Engineering",
    summary:
      "Learn cloud fundamentals hands-on across compute, networking, storage, and identity, then automate deployments, manage costs, monitor workloads, and operate production-ready infrastructure with confidence.",
    duration: "10 weeks",
    level: "beginner",
    mode: "hybrid",
    audience: [
      "Students",
      "Career changers",
      "Software developers",
      "Cloud engineers",
      "IT administrators",
      "Operations staff",
    ],
    prerequisites: [
      "No previous cloud experience required",
      "Basic computer and internet fundamentals",
      "Comfort with command-line basics",
      "Willingness to learn networking concepts",
    ],
    technologies: [
      "Virtual networks",
      "Virtual machines",
      "Managed compute",
      "IAM roles",
      "Access policies",
      "Provisioning templates",
      "Cost monitors",
    ],
    projects: [
      "Isolated virtual network with subnets and routing",
      "Repeatable virtual machine deployment",
      "Least-privilege identity and access setup",
      "Capstone: Production-ready monitored cloud workload",
    ],
    skills: [
      "Cloud networking",
      "Compute deployment",
      "Identity management",
      "Least-privilege access",
      "Environment automation",
      "Cost management",
      "Workload monitoring",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build virtual networks, subnets, and routing rules for isolated cloud workloads.",
      "Deploy virtual machines and managed compute services with repeatable configurations.",
      "Secure cloud identities using roles, policies, and least-privilege access controls.",
      "Automate provisioning with templates and scripts for consistent environments.",
      "Integrate object, block, and file storage into application architectures.",
      "Optimize cloud spending with budgets, tagging, and right-sizing practices.",
      "Evaluate reliability using backups, health checks, and multi-zone placement.",
      "Architect a production-ready cloud workload with monitoring and documentation.",
    ],
    curriculum: [
      "Module 01 — Cloud Foundations and Service Models",
      "Module 02 — Virtual Networking and Connectivity",
      "Module 03 — Compute Services and Scaling Basics",
      "Module 04 — Storage Services and Data Placement",
      "Module 05 — Identity, Access, and Security Baselines",
      "Module 06 — Automation with Templates and Scripts",
      "Module 07 — Monitoring, Logging, and Alerting",
      "Module 08 — Cost Management and Budget Controls",
      "Module 09 — Reliability, Backups, and Recovery",
      "Module 10 — Capstone: Deploy a Production-Ready Cloud Workload",
    ],
    faqs: [
      {
        question: "Who is this course for, and are there prerequisites?",
        answer:
          "This beginner course suits learners with basic computer and programming literacy. No prior cloud experience is needed; networking, Linux, and pricing concepts are introduced from first principles.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will configure networks, compute, storage, and identity controls across guided labs, culminating in a capstone where you deploy and document a monitored, cost-aware cloud workload.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Related roles learners explore include cloud support associate, systems administrator, network operations analyst, cloud analyst, infrastructure technician, site reliability associate, and DevOps trainee.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Cloud Engineering | HIGAET Academy",
      description:
        "A 10-week hybrid cloud engineering course covering core services, networking, storage, identity, automation, cost control, and production deployment skills.",
      keywords: [
        "cloud engineering",
        "cloud fundamentals",
        "virtual networking",
        "cloud storage",
        "identity management",
        "infrastructure automation",
        "cloud cost management",
        "cloud monitoring",
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
    id: "academy_course_devops_engineering",
    slug: "devops-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET DevOps Engineering",
    summary:
      "Build reliable delivery pipelines with Git, CI, automated testing, and safe releases, then operate observable infrastructure, manage incidents, and improve deployment speed with steady confidence.",
    duration: "12 weeks",
    level: "intermediate",
    mode: "hybrid",
    audience: [
      "Software developers",
      "Backend developers",
      "Cloud engineers",
      "DevOps practitioners",
      "IT administrators",
      "Engineering managers",
    ],
    prerequisites: [
      "Comfortable with Git basics and command line",
      "Familiarity with software build and test concepts",
      "Basic scripting knowledge",
      "Understanding of application deployment basics",
    ],
    technologies: [
      "Git",
      "CI pipelines",
      "Automated testing tools",
      "Quality gates",
      "Staged rollouts",
      "Approval workflows",
      "Observability dashboards",
    ],
    projects: [
      "Collaborative branching and review workflow",
      "CI pipeline with automated tests and quality gates",
      "Staged rollout with approvals and rollback",
      "Capstone: Observable delivery pipeline with incident runbook",
    ],
    skills: [
      "Version control workflows",
      "Continuous integration",
      "Automated testing",
      "Safe releases",
      "Rollback planning",
      "Incident management",
      "Deployment observability",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Design branching, review, and merge workflows for collaborative delivery teams.",
      "Build continuous integration pipelines with automated tests and quality gates.",
      "Deploy applications using staged rollouts, approvals, and rollback procedures.",
      "Automate infrastructure provisioning with version-controlled configuration.",
      "Integrate artifact registries and environment promotion into release flows.",
      "Evaluate pipeline health using lead time, failure rate, and recovery metrics.",
      "Secure pipelines with scoped credentials, signing, and access controls.",
      "Optimize incident response with runbooks, postmortems, and on-call practices.",
    ],
    curriculum: [
      "Module 01 — DevOps Foundations and Delivery Models",
      "Module 02 — Git Workflows and Collaboration Practices",
      "Module 03 — Continuous Integration and Quality Gates",
      "Module 04 — Artifact Management and Environment Promotion",
      "Module 05 — Continuous Delivery and Release Strategies",
      "Module 06 — Infrastructure Automation and Configuration",
      "Module 07 — Observability, Alerting, and Incident Response",
      "Module 08 — Security Basics for Delivery Pipelines",
      "Module 09 — Scaling Delivery Across Teams and Services",
      "Module 10 — Capstone: Ship a Fully Automated Release Pipeline",
    ],
    faqs: [
      {
        question: "Who is this course for, and are there prerequisites?",
        answer:
          "This intermediate course suits learners comfortable with the command line, Git basics, and one programming language. Familiarity with cloud concepts helps but advanced administration is not required.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will build automated CI pipelines, staged release flows, and version-controlled infrastructure, culminating in a capstone with a complete pipeline from commit to observable production deployment.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Related roles learners explore include DevOps engineer, build and release engineer, site reliability engineer, platform engineer, automation engineer, cloud engineer, and infrastructure engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "DevOps Engineering | HIGAET Academy",
      description:
        "A 12-week hybrid DevOps course covering Git workflows, CI pipelines, artifact releases, infrastructure automation, observability, and delivery.",
      keywords: [
        "devops engineering",
        "ci cd pipelines",
        "git workflows",
        "release management",
        "infrastructure automation",
        "deployment strategies",
        "devops observability",
        "incident response",
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
    id: "academy_course_kubernetes_engineering",
    slug: "kubernetes-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET Kubernetes Engineering",
    summary:
      "Operate Kubernetes workloads with confidence across pods, deployments, services, ingress, and storage, then package with Helm, observe clusters, and manage upgrades and reliability.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Cloud engineers",
      "DevOps practitioners",
      "Platform engineers",
      "IT administrators",
    ],
    prerequisites: [
      "Familiarity with containers and command line",
      "Basic networking and YAML concepts",
      "Understanding of application deployment basics",
    ],
    technologies: [
      "Kubernetes pods",
      "Deployments",
      "ReplicaSets",
      "Services",
      "Ingress controllers",
      "Persistent volumes",
      "Helm charts",
      "Cluster observability",
    ],
    projects: [
      "Hardened pod specs with probes and resources",
      "Rolling application update with deployments",
      "Service discovery with ingress routing",
      "Capstone: Observable stateful cluster with Helm and upgrades",
    ],
    skills: [
      "Pod configuration",
      "Rolling updates",
      "Service discovery",
      "Ingress routing",
      "Persistent storage",
      "Helm packaging",
      "Cluster upgrades",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build pod specifications with probes, resources, and lifecycle controls.",
      "Deploy rolling and staged application updates using deployments and replicasets.",
      "Design service discovery and ingress routing for internal and external traffic.",
      "Integrate persistent volumes and storage classes into stateful workloads.",
      "Automate application packaging and releases with Helm charts and values.",
      "Evaluate cluster and workload health using metrics, logs, and traces.",
      "Secure workloads with RBAC, namespaces, network policies, and secrets handling.",
      "Optimize cluster operations with upgrades, autoscaling, and backup procedures.",
    ],
    curriculum: [
      "Module 01 — Kubernetes Foundations and Cluster Architecture",
      "Module 02 — Pods, Scheduling, and Configuration",
      "Module 03 — Deployments, Scaling, and Update Strategies",
      "Module 04 — Services, Ingress, and Traffic Routing",
      "Module 05 — Storage, Volumes, and Stateful Workloads",
      "Module 06 — Helm Packaging and Release Management",
      "Module 07 — Observability, Troubleshooting, and Autoscaling",
      "Module 08 — Cluster Operations, Security, and Upgrades",
      "Module 09 — Capstone: Operate a Production-Grade Kubernetes Service",
    ],
    faqs: [
      {
        question: "Who is this course for, and are there prerequisites?",
        answer:
          "This advanced course suits learners comfortable with containers, YAML, Linux commands, and networking basics. Prior Docker and command-line experience is expected before enrolling.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will deploy, expose, store, package, and observe containerized services across guided clusters, culminating in a capstone operating a versioned service with ingress, storage, and monitoring.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Related roles learners explore include Kubernetes administrator, container platform engineer, site reliability engineer, DevOps engineer, cloud infrastructure engineer, and systems engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Kubernetes Engineering | HIGAET Academy",
      description:
        "An 8-week online Kubernetes course covering pods, deployments, services, ingress, storage, Helm, observability, upgrades, and production cluster operations.",
      keywords: [
        "kubernetes engineering",
        "pods and deployments",
        "kubernetes services",
        "ingress routing",
        "persistent storage",
        "helm charts",
        "cluster observability",
        "cluster operations",
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
    id: "academy_course_devsecops",
    slug: "devsecops",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET DevSecOps",
    summary:
      "Shift security left across code, pipelines, images, and runtime by adding threat modeling, secrets handling, scanning, policy checks, monitoring, and disciplined incident response habits.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "DevOps practitioners",
      "Security practitioners",
      "Cloud engineers",
      "Platform engineers",
      "Engineering managers",
    ],
    prerequisites: [
      "Familiarity with Git and CI pipelines",
      "Basic container and deployment concepts",
      "Understanding of application delivery workflows",
    ],
    technologies: [
      "Threat modeling",
      "CI runners",
      "Artifact signing",
      "Static analysis",
      "Dependency scanners",
      "Container image scanners",
      "Secrets managers",
    ],
    projects: [
      "Risk-ranked threat model for a pipeline",
      "Hardened CI pipeline with signed artifacts",
      "Automated code and image scanning workflow",
      "Capstone: Secure pipeline with secrets rotation and incident response",
    ],
    skills: [
      "Threat modeling",
      "Pipeline hardening",
      "Static analysis",
      "Dependency checking",
      "Image scanning",
      "Secrets management",
      "Incident response",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Develop threat models and risk-ranked controls for delivery pipelines.",
      "Secure CI pipelines with least-privilege runners, signed artifacts, and reviews.",
      "Automate static analysis, dependency checks, and container image scanning.",
      "Integrate secrets management and rotation into builds and deployments.",
      "Evaluate runtime posture with hardening checks and vulnerability triage.",
      "Design policy guardrails that block risky changes without slowing teams.",
      "Deploy signed, traceable releases with audit-ready change records.",
      "Optimize response with detection playbooks and structured postmortems.",
    ],
    curriculum: [
      "Module 01 — DevSecOps Foundations and Threat Modeling",
      "Module 02 — Secure Coding and Dependency Management",
      "Module 03 — Pipeline Security and Artifact Integrity",
      "Module 04 — Secrets Management and Identity Controls",
      "Module 05 — Container and Infrastructure Scanning",
      "Module 06 — Policy Guardrails and Compliance Checks",
      "Module 07 — Runtime Monitoring and Incident Response",
      "Module 08 — Capstone: Harden an End-to-End Delivery Pipeline",
    ],
    faqs: [
      {
        question: "Who is this course for, and are there prerequisites?",
        answer:
          "This advanced course suits learners with working DevOps or cloud experience, including CI pipelines and Linux fundamentals. Basic security vocabulary is helpful but formal security training is not required.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will add scanning, secrets handling, signing, and policy checks to a sample pipeline, culminating in a capstone that hardens an end-to-end build-to-runtime workflow with documented controls.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Related roles learners explore include DevSecOps engineer, application security engineer, security automation engineer, platform security engineer, cloud security analyst, and release engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "DevSecOps | HIGAET Academy",
      description:
        "An 8-week online DevSecOps course covering threat modeling, pipeline security, secrets handling, image scanning, policy guardrails, and secure releases.",
      keywords: [
        "devsecops course",
        "pipeline security",
        "threat modeling",
        "secrets management",
        "image scanning",
        "policy guardrails",
        "vulnerability triage",
        "secure releases",
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
    id: "academy_course_platform_engineering",
    slug: "platform-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET Platform Engineering",
    summary:
      "Design internal developer platforms with golden paths, templates, self-service environments, and policy guardrails that reduce cognitive load and standardize reliable production delivery.",
    duration: "10 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "DevOps practitioners",
      "Platform engineers",
      "Cloud engineers",
      "Engineering managers",
      "Technology leaders",
    ],
    prerequisites: [
      "Familiarity with CI pipelines and cloud infrastructure",
      "Understanding of service delivery workflows",
      "Basic templating and automation concepts",
    ],
    technologies: [
      "Golden-path templates",
      "Self-service portals",
      "Environment quotas",
      "Approval workflows",
      "Policy guardrails",
      "Service scaffolding",
      "Delivery metrics",
    ],
    projects: [
      "Platform vision with users and success metrics",
      "Golden-path service and pipeline template",
      "Self-service environment with quotas and approvals",
      "Capstone: Internal developer platform with guardrailed delivery path",
    ],
    skills: [
      "Platform design",
      "Golden-path design",
      "Template building",
      "Self-service environments",
      "Policy guardrails",
      "Developer experience",
      "Delivery standardization",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Architect internal platform visions with clear users, boundaries, and success metrics.",
      "Build golden-path templates for services, pipelines, and infrastructure baselines.",
      "Develop self-service environments with quotas, approvals, and lifecycle controls.",
      "Deploy reusable platform APIs and automation behind documented interfaces.",
      "Integrate identity, policy, and cost guardrails into every paved road.",
      "Evaluate platform adoption using friction logs, surveys, and delivery metrics.",
      "Secure multi-tenant platforms with isolation, RBAC, and audit trails.",
      "Optimize platform reliability with versioning, change management, and support models.",
    ],
    curriculum: [
      "Module 01 — Platform Engineering Foundations and Product Thinking",
      "Module 02 — Developer Experience and Golden Paths",
      "Module 03 — Templates, Scaffolding, and Service Catalogs",
      "Module 04 — Self-Service Environments and Provisioning",
      "Module 05 — Platform APIs and Automation Layers",
      "Module 06 — Policy, Governance, and Cost Guardrails",
      "Module 07 — Observability and Support Models for Platforms",
      "Module 08 — Multi-Tenancy, Isolation, and Access Design",
      "Module 09 — Adoption, Metrics, and Platform Evolution",
      "Module 10 — Capstone: Deliver a Working Internal Developer Platform",
    ],
    faqs: [
      {
        question: "Who is this course for, and are there prerequisites?",
        answer:
          "This advanced course suits DevOps, SRE, or backend practitioners comfortable with cloud services, CI pipelines, and infrastructure automation. Team leadership experience is useful but not required.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will design templates, self-service flows, and guardrails for a sample organization, culminating in a capstone delivering a documented internal platform with a working golden-path service.",
      },
      {
        question: "What career paths does this course relate to?",
        answer:
          "Related roles learners explore include platform engineer, developer experience engineer, site reliability engineer, DevOps engineer, cloud architect, infrastructure product manager, and systems engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Platform Engineering | HIGAET Academy",
      description:
        "A 10-week online platform engineering course covering shared platforms, golden paths, self-service, environments, policy, observability, and reliable operations.",
      keywords: [
        "platform engineering",
        "developer platforms",
        "golden paths",
        "self service environments",
        "service catalogs",
        "platform apis",
        "policy guardrails",
        "platform adoption",
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
    id: "academy_course_ai_infrastructure_engineering",
    slug: "ai-infrastructure-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET AI Infrastructure Engineering",
    summary:
      "Design GPU-powered infrastructure for training and serving AI systems, covering compute clusters, inference endpoints, batch pipelines, observability, cost control, and latency optimization for production workloads.",
    duration: "10 weeks",
    level: "advanced",
    mode: "hybrid",
    audience: [
      "AI engineers",
      "ML engineers",
      "Data engineers",
      "Cloud engineers",
      "Platform engineers",
      "Backend developers",
    ],
    prerequisites: [
      "Familiarity with cloud compute and Python basics",
      "Understanding of ML training and inference concepts",
      "Basic networking and storage knowledge",
    ],
    technologies: [
      "GPU clusters",
      "Inference endpoints",
      "Batch pipelines",
      "Autoscaling policies",
      "Response caching",
      "Checkpointing",
      "Latency monitors",
      "Cost controls",
    ],
    projects: [
      "GPU cluster layout with capacity and isolation plan",
      "Scalable inference endpoint with batching and autoscaling",
      "Batch training pipeline with retries and checkpointing",
      "Capstone: Production GPU platform with observability and cost control",
    ],
    skills: [
      "GPU cluster planning",
      "Inference serving",
      "Batch orchestration",
      "Autoscaling",
      "Latency optimization",
      "Observability",
      "Cost control",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Architect GPU cluster layouts for training and inference with capacity and isolation planning.",
      "Deploy scalable inference endpoints with batching, caching, and autoscaling policies.",
      "Build batch data and training pipelines with scheduling, retries, and checkpointing.",
      "Optimize inference latency and throughput using quantization, batching, and request routing.",
      "Evaluate infrastructure cost and performance trade-offs across GPU types and regions.",
      "Integrate observability for GPU utilization, queue depth, latency, and error signals.",
      "Secure model artifacts, endpoints, and cluster access with networks and identity controls.",
      "Automate provisioning of AI infrastructure with repeatable templates and environment promotion.",
    ],
    curriculum: [
      "Module 01 — Foundations of AI infrastructure and GPU computing",
      "Module 02 — Compute clusters, storage, and networking for training",
      "Module 03 — Containers and orchestration for ML workloads",
      "Module 04 — Inference serving patterns and model endpoints",
      "Module 05 — Batch pipelines, schedulers, and data movement",
      "Module 06 — Latency and throughput optimization techniques",
      "Module 07 — Cost governance, quotas, and capacity planning",
      "Module 08 — Observability, security, and production operations",
      "Module 09 — Capstone: production-ready AI infrastructure for a model workload",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "It suits engineers comfortable with Linux, containers, and basic cloud services. Familiarity with Python and machine learning workflows helps, and each module reviews the infrastructure concepts it builds on.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will build GPU cluster templates, an inference endpoint with autoscaling, and a batch pipeline, finishing with a capstone that provisions and documents production-ready AI infrastructure for a model workload.",
      },
      {
        question: "Which roles use these skills?",
        answer:
          "Learners apply these skills in roles such as AI infrastructure engineer, ML platform engineer, cloud engineer, DevOps engineer, systems engineer, and solutions architect. Actual titles vary by employer and experience.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Infrastructure Engineering | HIGAET Academy",
      description:
        "Build GPU clusters, inference services, and batch pipelines with cost and latency controls in this 10-week hybrid AI infrastructure engineering course.",
      keywords: [
        "ai infrastructure",
        "gpu compute",
        "inference serving",
        "batch pipelines",
        "ml platform",
        "cost optimization",
        "latency tuning",
        "hybrid cloud",
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
    id: "academy_course_cloud_architecture",
    slug: "cloud-architecture",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET Cloud Architecture",
    summary:
      "Learn to design resilient multi-tier cloud architectures across compute, storage, and networking, with patterns for scaling, high availability, decoupling, cost awareness, and secure landing zones.",
    duration: "8 weeks",
    level: "professional",
    mode: "online",
    audience: [
      "Software developers",
      "Cloud engineers",
      "Backend developers",
      "Technology leaders",
      "Engineering managers",
      "IT administrators",
    ],
    prerequisites: [
      "Basic cloud compute, storage, and networking concepts",
      "Understanding of application tiers and APIs",
      "Familiarity with deployment fundamentals",
    ],
    technologies: [
      "Multi-tier architectures",
      "Availability zones",
      "Disaster recovery",
      "Event queues",
      "Managed services",
      "Decoupling patterns",
      "Landing zones",
    ],
    projects: [
      "Multi-tier solution across compute, storage, and networking",
      "High-availability pattern across zones and regions",
      "Decoupled event-driven architecture",
      "Capstone: Resilient secure landing zone with cost-aware design",
    ],
    skills: [
      "Multi-tier design",
      "High availability",
      "Disaster recovery",
      "Event-driven decoupling",
      "Cost-aware design",
      "Secure architecture",
      "Service selection",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Architect multi-tier cloud solutions across compute, storage, and networking layers.",
      "Design high-availability and disaster-recovery patterns across zones and regions.",
      "Develop decoupled architectures using queues, events, and managed services.",
      "Evaluate build-versus-managed-service trade-offs for scale and operations.",
      "Secure landing zones with identity, network segmentation, and policy guardrails.",
      "Optimize cloud architectures for cost, performance, and operational overhead.",
      "Integrate observability, backup, and recovery into architecture blueprints.",
      "Deploy reference architectures with documentation, diagrams, and decision records.",
    ],
    curriculum: [
      "Module 01 — Foundations of cloud architecture and well-architected principles",
      "Module 02 — Compute, storage, and networking building blocks",
      "Module 03 — Identity, access, and landing zone design",
      "Module 04 — Decoupled and event-driven architecture patterns",
      "Module 05 — High availability, scaling, and disaster recovery",
      "Module 06 — Data architectures, caching, and messaging",
      "Module 07 — Cost, governance, and architecture trade-offs",
      "Module 08 — Capstone: end-to-end cloud architecture blueprint with review",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "It suits working engineers and technical leads with basic cloud experience. Comfort with one cloud console, networking basics, and core services helps you follow the architecture exercises.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will produce architecture diagrams, decision records, and a landing zone design, finishing with a capstone blueprint for a multi-tier application covering availability, security, and cost.",
      },
      {
        question: "Which roles use these skills?",
        answer:
          "Learners apply these skills in roles such as cloud architect, solutions architect, platform engineer, infrastructure consultant, systems engineer, and technical lead. Actual titles vary by employer and experience.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Cloud Architecture | HIGAET Academy",
      description:
        "Design scalable, available, and secure cloud architectures across compute, storage, and networking in this 8-week online cloud architecture course.",
      keywords: [
        "cloud architecture",
        "solution design",
        "landing zones",
        "high availability",
        "cloud networking",
        "disaster recovery",
        "cost architecture",
        "well-architected",
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
    id: "academy_course_infrastructure_engineering",
    slug: "infrastructure-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET Infrastructure Engineering",
    summary:
      "Build strong foundations in compute, networking, storage, and Linux operations, learning to provision, configure, monitor, and troubleshoot reliable infrastructure that supports modern application delivery.",
    duration: "10 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Students",
      "Career changers",
      "IT administrators",
      "Operations staff",
      "Software developers",
      "Cloud engineers",
    ],
    prerequisites: [
      "No previous infrastructure operations experience required",
      "Basic computer and operating system familiarity",
      "Comfort learning Linux command line",
    ],
    technologies: [
      "Virtual machines",
      "Containers",
      "Virtual networks",
      "Linux servers",
      "Configuration baselines",
      "Provisioning scripts",
      "Monitoring tools",
    ],
    projects: [
      "Virtual machine and network hosting an application stack",
      "Hardened Linux server with patching baseline",
      "Scripted provisioning and configuration workflow",
      "Capstone: Monitored reliable infrastructure stack with troubleshooting runbook",
    ],
    skills: [
      "Compute provisioning",
      "Network configuration",
      "Linux operations",
      "Server hardening",
      "Configuration management",
      "Infrastructure monitoring",
      "Troubleshooting",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build virtual machines, containers, and networks that host reliable application stacks.",
      "Deploy Linux servers with hardening, patching, and configuration baselines.",
      "Automate routine provisioning and configuration with scripts and templates.",
      "Evaluate storage and backup options for durability and recovery needs.",
      "Secure infrastructure access with SSH practices, firewalls, and identity controls.",
      "Integrate monitoring, logging, and alerting across servers and services.",
      "Optimize resource sizing and performance for steady-state workloads.",
      "Develop runbooks for troubleshooting, incident handling, and routine operations.",
    ],
    curriculum: [
      "Module 01 — Foundations of infrastructure engineering and Linux",
      "Module 02 — Compute, virtualization, and containers",
      "Module 03 — Networking essentials: DNS, routing, and load balancing",
      "Module 04 — Storage, backups, and recovery practices",
      "Module 05 — Configuration management and templating",
      "Module 06 — Identity, access, and infrastructure hardening",
      "Module 07 — Monitoring, logging, and alerting",
      "Module 08 — Performance tuning and capacity basics",
      "Module 09 — Capstone: production-style infrastructure stack with runbooks",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "It suits aspiring infrastructure and support engineers with basic command-line comfort. No prior administration background is assumed, and early modules establish Linux and networking fundamentals.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will provision servers, networks, and storage with monitoring and backups, finishing with a capstone infrastructure stack complete with configuration templates and operational runbooks.",
      },
      {
        question: "Which roles use these skills?",
        answer:
          "Learners apply these skills in roles such as infrastructure engineer, systems administrator, network operations engineer, cloud support engineer, DevOps engineer, and site reliability engineer. Actual titles vary by employer and experience.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Infrastructure Engineering | HIGAET Academy",
      description:
        "Provision and operate compute, network, and storage foundations with Linux, monitoring, and troubleshooting in this 10-week online infrastructure course.",
      keywords: [
        "infrastructure engineering",
        "linux administration",
        "computer networking",
        "server management",
        "storage and backup",
        "monitoring basics",
        "system troubleshooting",
        "it operations",
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
    id: "academy_course_sre",
    slug: "site-reliability-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET Site Reliability Engineering",
    summary:
      "Practice site reliability engineering through service-level objectives, error budgets, incident response, chaos experiments, observability, automation, and steady reduction of operational toil.",
    duration: "10 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "DevOps practitioners",
      "Cloud engineers",
      "Platform engineers",
      "Operations staff",
    ],
    prerequisites: [
      "Familiarity with Linux, scripting, and deployments",
      "Basic monitoring and alerting concepts",
      "Understanding of production operations",
    ],
    technologies: [
      "Service-level indicators",
      "Error budgets",
      "Golden-signal dashboards",
      "Alerting rules",
      "Runbooks",
      "Chaos experiments",
      "Scheduled jobs",
    ],
    projects: [
      "Service-level objectives with error-budget policy",
      "Golden-signal dashboard with alerts and runbook",
      "Blameless incident review with response roles",
      "Capstone: Self-healing service with toil automation and chaos validation",
    ],
    skills: [
      "SLO design",
      "Error-budget management",
      "Observability",
      "Alert design",
      "Incident response",
      "Toil automation",
      "Chaos engineering",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Design service-level indicators, objectives, and error-budget policies for real services.",
      "Build golden-signal dashboards, alerts, and runbooks tied to user impact.",
      "Develop incident response practices with roles, communication, and blameless reviews.",
      "Automate toil-heavy operational tasks with scripts, scheduled jobs, and self-healing checks.",
      "Evaluate release safety with error budgets, deployment gates, and rollback plans.",
      "Deploy chaos and resilience experiments that validate failure assumptions safely.",
      "Secure on-call operations with access controls, audit trails, and escalation paths.",
      "Optimize alert quality and on-call load through tuning and paging discipline.",
    ],
    curriculum: [
      "Module 01 — Foundations of site reliability and service ownership",
      "Module 02 — SLIs, SLOs, and error-budget design",
      "Module 03 — Observability: metrics, logs, traces, and alerting",
      "Module 04 — Incident response and blameless postmortems",
      "Module 05 — Chaos engineering and resilience testing",
      "Module 06 — Release engineering and safe deployment gates",
      "Module 07 — Toil measurement and operations automation",
      "Module 08 — On-call health, paging, and capacity planning",
      "Module 09 — Capstone: SLO-driven reliability program for a live-style service",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "It suits engineers with Linux, cloud, and incident-handling exposure who want structured reliability practices. Comfort with monitoring tools and basic scripting helps with the hands-on labs.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will define SLOs, build dashboards and runbooks, and run incident and chaos drills, finishing with a capstone reliability program covering budgets, response plans, and automation.",
      },
      {
        question: "Which roles use these skills?",
        answer:
          "Learners apply these skills in roles such as site reliability engineer, platform engineer, DevOps engineer, production engineer, cloud operations engineer, and infrastructure engineer. Actual titles vary by employer and experience.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Site Reliability Engineering | HIGAET Academy",
      description:
        "Apply SLOs, error budgets, incident response, chaos testing, and automation to run reliable services in this 10-week online SRE course for engineers.",
      keywords: [
        "site reliability engineering",
        "slos and error budgets",
        "incident response",
        "chaos engineering",
        "observability",
        "toil reduction",
        "on-call practices",
        "release safety",
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
    id: "academy_course_cloud_automation_engineering",
    slug: "cloud-automation-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cloud_infrastructure",
    title: "HIGAET Cloud Automation Engineering",
    summary:
      "Automate cloud provisioning and operations with infrastructure as code, policy checks, CI pipelines, reusable modules, drift detection, and safe rollout practices across environments.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Cloud engineers",
      "DevOps practitioners",
      "Platform engineers",
      "Software developers",
      "IT administrators",
      "Operations staff",
    ],
    prerequisites: [
      "Familiarity with cloud resources and command line",
      "Basic scripting and version control concepts",
      "Understanding of environment promotion basics",
    ],
    technologies: [
      "Infrastructure as code",
      "Reusable modules",
      "Versioned stacks",
      "Policy checks",
      "CI pipelines",
      "Drift detection",
      "Promotion workflows",
    ],
    projects: [
      "Reusable infrastructure-as-code network and compute module",
      "Versioned environment stack with promotion workflow",
      "Policy checks for tagging, cost, and security baselines",
      "Capstone: Automated multi-environment rollout with drift detection",
    ],
    skills: [
      "Infrastructure as code",
      "Module design",
      "Environment automation",
      "Policy enforcement",
      "Drift detection",
      "Safe rollouts",
      "Pipeline automation",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build reusable infrastructure-as-code modules for networks, compute, and data services.",
      "Automate environment provisioning with versioned stacks and promotion workflows.",
      "Deploy policy checks that guard naming, tagging, cost, and security baselines.",
      "Integrate infrastructure pipelines with testing, approvals, and plan reviews.",
      "Evaluate drift, state conflicts, and recovery paths for managed stacks.",
      "Secure pipeline credentials, state files, and privileged automation roles.",
      "Optimize pipeline speed and feedback with caching, layering, and targeted plans.",
      "Develop rollback and recovery procedures for failed infrastructure changes.",
    ],
    curriculum: [
      "Module 01 — Foundations of cloud automation and infrastructure as code",
      "Module 02 — Templating, modules, and state management",
      "Module 03 — Networks and compute automation patterns",
      "Module 04 — Policy as code and guardrails",
      "Module 05 — CI pipelines for infrastructure changes",
      "Module 06 — Drift detection, testing, and safe rollouts",
      "Module 07 — Secrets, state security, and multi-environment promotion",
      "Module 08 — Capstone: automated cloud delivery pipeline with guardrails",
    ],
    faqs: [
      {
        question: "Who is this course for and what should I know first?",
        answer:
          "It suits cloud and DevOps learners comfortable with the command line and basic cloud services. Introductory scripting and version-control familiarity help, and early modules review both.",
      },
      {
        question: "What will I build during the course?",
        answer:
          "You will build versioned infrastructure modules, policy checks, and a CI pipeline with drift detection, finishing with a capstone automated delivery pipeline across staged environments.",
      },
      {
        question: "Which roles use these skills?",
        answer:
          "Learners apply these skills in roles such as cloud automation engineer, DevOps engineer, platform engineer, infrastructure engineer, release engineer, and cloud engineer. Actual titles vary by employer and experience.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Cloud Automation Engineering | HIGAET Academy",
      description:
        "Automate cloud delivery with infrastructure as code, policies, pipelines, and drift control in this 8-week online cloud automation engineering course.",
      keywords: [
        "cloud automation",
        "infrastructure as code",
        "iac modules",
        "policy as code",
        "ci pipelines",
        "drift detection",
        "cloud provisioning",
        "devops automation",
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
    id: "academy_course_data_analytics",
    slug: "data-analytics",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET Data Analytics",
    summary:
      "Learn SQL, Python, spreadsheets, and visualization to clean data, build dashboards, and deliver clear business reports through HIGAET Practical Training.",
    duration: "10 weeks",
    level: "beginner",
    mode: "hybrid",
    audience: [
      "Students",
      "Career changers",
      "Data analysts",
      "Product managers",
      "Operations staff",
      "Entrepreneurs",
    ],
    prerequisites: [
      "No previous analytics experience required",
      "Basic computer and spreadsheet comfort",
      "Willingness to learn SQL and Python basics",
    ],
    technologies: [
      "SQL",
      "Python",
      "Pandas",
      "Spreadsheets",
      "Power BI",
      "Tableau",
      "Data visualization tools",
    ],
    projects: [
      "Business KPI dashboard",
      "SQL sales analysis pack",
      "Python data cleaning workflow",
      "Dataset quality profiling report",
      "Capstone: Business performance report with dashboard",
    ],
    skills: [
      "SQL querying",
      "Data cleaning",
      "Data visualization",
      "Dashboard design",
      "Exploratory analysis",
      "Business reporting",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build interactive dashboards and reports that answer defined business questions with clean visuals",
      "Design SQL queries for joins, aggregation, filtering, and windowed analysis on business datasets",
      "Develop Python data workflows for cleaning, transformation, and exploratory analysis",
      "Evaluate dataset quality by profiling missing values, duplicates, outliers, and inconsistencies",
      "Automate recurring spreadsheet and reporting workflows with reusable templates and checks",
      "Optimize dashboard performance and clarity through layout, filtering, and aggregation choices",
      "Integrate multiple data sources into unified analysis-ready tables for reporting",
      "Architect a documented analytics portfolio project with metrics, methods, and findings",
    ],
    curriculum: [
      "Module 01 — Foundations: Analytics Thinking, Metrics, and the Data Analysis Lifecycle",
      "Module 02 — Core: SQL for Selection, Joins, Aggregation, and Business Queries",
      "Module 03 — Core: Data Cleaning, Validation, and Exploratory Analysis with Python",
      "Module 04 — Core: Statistics for Analysts Including Distributions and Comparisons",
      "Module 05 — Engineering: Visualization Design and Interactive Dashboard Construction",
      "Module 06 — Engineering: Multi-Source Integration and Reporting Automation",
      "Module 07 — Advanced: Cohort, Funnel, and Trend Analysis for Decision Support",
      "Module 08 — Production: Stakeholder Reporting, Documentation, and Insight Reviews",
      "Module 09 — Capstone: End-to-End Business Analytics Dashboard and Insight Report",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This beginner course suits students, career changers, and business professionals entering analytics. No prior coding is required; comfort with spreadsheets and basic mathematics plus HIGAET Practical Training support is enough to begin.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a SQL business-query portfolio, an exploratory analysis notebook, and a capstone analytics dashboard with an insight report covering metrics, trends, and recommendations.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as data analyst, business intelligence analyst, reporting analyst, operations analyst, marketing analyst, product analyst, and analytics associate.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Data Analytics | HIGAET Academy",
      description:
        "Learn SQL, Python, dashboards, and applied statistics in this beginner HIGAET Academy course with hands-on analytics and reporting projects.",
      keywords: [
        "data analytics",
        "sql for analytics",
        "python pandas",
        "data visualization",
        "business intelligence",
        "dashboards",
        "excel reporting",
        "data analyst roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_data_science",
    slug: "data-science",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET Data Science",
    summary:
      "Learn statistics, Python, and machine learning fundamentals to analyze datasets, build predictive models, and communicate insights with HIGAET Practical Training.",
    duration: "14 weeks",
    level: "intermediate",
    mode: "hybrid",
    audience: [
      "Students",
      "Career changers",
      "Data analysts",
      "Data scientists",
      "Software developers",
      "Researchers",
    ],
    prerequisites: [
      "Comfortable with Python fundamentals",
      "Basic statistics and algebra",
      "Familiarity with data tables and CSV files",
    ],
    technologies: ["Python", "Pandas", "NumPy", "Scikit-learn", "Jupyter", "Matplotlib", "Seaborn"],
    projects: [
      "Regression prediction model",
      "Classification model with cross-validation",
      "Hypothesis testing study",
      "Feature engineering pipeline",
      "Capstone: Predictive modeling and insights report",
    ],
    skills: [
      "Statistical analysis",
      "Predictive modeling",
      "Feature engineering",
      "Hypothesis testing",
      "Model evaluation",
      "Data storytelling",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build predictive models for regression and classification using Python machine learning libraries",
      "Design experiments and hypothesis tests that distinguish correlation from measurable effects",
      "Develop feature engineering pipelines that improve model signal and reduce leakage",
      "Evaluate models with cross-validation, error analysis, and appropriate performance metrics",
      "Automate exploratory analysis and reporting workflows with reproducible notebooks",
      "Optimize model performance through tuning, regularization, and feature selection",
      "Integrate model outputs into dashboards and narratives for non-technical stakeholders",
      "Architect a documented data science case study from problem framing to recommendations",
    ],
    curriculum: [
      "Module 01 — Foundations: Data Science Workflow, Problem Framing, and Reproducible Analysis",
      "Module 02 — Core: Python for Data Analysis Including Wrangling and Visualization",
      "Module 03 — Core: Probability, Statistical Inference, and Hypothesis Testing",
      "Module 04 — Core: Regression, Classification, and Model Evaluation Methods",
      "Module 05 — Engineering: Feature Engineering, Selection, and Data Leakage Control",
      "Module 06 — Engineering: Tree-Based Models, Ensembles, and Hyperparameter Tuning",
      "Module 07 — Advanced: Unsupervised Learning Including Clustering and Dimensionality Reduction",
      "Module 08 — Advanced: Storytelling with Data and Stakeholder Communication",
      "Module 09 — Production: Model Documentation, Limitations, and Responsible Analysis",
      "Module 10 — Capstone: Predictive Data Science Project with Model and Insight Report",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This intermediate course suits analytics learners and developers moving into data science. Basic Python and SQL plus high-school mathematics help; early modules refresh statistics and programming through HIGAET Practical Training.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build an exploratory analysis portfolio, a tuned predictive model with evaluation reports, and a capstone case study combining modeling, visualizations, and business recommendations.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as data scientist, analytics scientist, machine learning analyst, business intelligence developer, quantitative analyst, research analyst, and product data analyst.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Data Science | HIGAET Academy",
      description:
        "Master statistics, Python, machine learning basics, and storytelling in this intermediate HIGAET Academy data science course with guided projects.",
      keywords: [
        "data science",
        "python for data science",
        "statistics",
        "predictive modeling",
        "feature engineering",
        "data visualization",
        "machine learning basics",
        "data scientist roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_data_engineering",
    slug: "data-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET Data Engineering",
    summary:
      "Learn Python, SQL, and pipeline tools to build warehouses, orchestrate workflows, and deliver reliable datasets through HIGAET Practical Training projects.",
    duration: "12 weeks",
    level: "intermediate",
    mode: "hybrid",
    audience: [
      "Software developers",
      "Backend developers",
      "Data engineers",
      "Data analysts",
      "Cloud engineers",
      "IT administrators",
    ],
    prerequisites: [
      "Comfortable with Python and SQL basics",
      "Familiarity with databases and file formats",
      "Basic command-line comfort",
    ],
    technologies: [
      "Python",
      "SQL",
      "Data warehouses",
      "Airflow",
      "dbt",
      "Docker",
      "Data validation tools",
    ],
    projects: [
      "Batch ingestion pipeline",
      "Dimensional warehouse model",
      "Orchestrated workflow with retries",
      "Data quality validation suite",
      "Capstone: Analytics-ready warehouse with orchestrated pipelines",
    ],
    skills: [
      "Pipeline development",
      "Data modeling",
      "Workflow orchestration",
      "SQL transformations",
      "Data quality testing",
      "Warehouse design",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build batch ingestion pipelines that load structured and semi-structured data into warehouses",
      "Design dimensional models and schemas that support analytics and reporting workloads",
      "Develop orchestrated workflows with retries, scheduling, and dependency management",
      "Evaluate data quality with validation tests, freshness checks, and anomaly detection",
      "Automate pipeline testing and deployment with version control and CI practices",
      "Optimize query and pipeline performance through partitioning, indexing, and incremental loads",
      "Integrate streaming sources with batch systems for unified data delivery",
      "Architect a production-style data platform project with documentation and monitoring",
    ],
    curriculum: [
      "Module 01 — Foundations: Data Engineering Lifecycle, Warehouses, Lakes, and Lakehouse Concepts",
      "Module 02 — Core: Advanced SQL and Data Modeling for Analytics Workloads",
      "Module 03 — Core: Python for Ingestion, Transformation, and File Format Handling",
      "Module 04 — Engineering: Batch Pipelines, Incremental Loads, and Idempotent Design",
      "Module 05 — Engineering: Workflow Orchestration, Scheduling, and Failure Recovery",
      "Module 06 — Engineering: Warehousing, Transformation Layers, and Data Contracts",
      "Module 07 — Advanced: Streaming Ingestion and Near-Real-Time Processing Patterns",
      "Module 08 — Production: Data Quality, Observability, Security, and Access Control",
      "Module 09 — Capstone: Production-Style Data Pipeline with Warehouse and Monitoring",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This intermediate course suits developers, analysts, and database practitioners moving into data engineering. Basic Python and SQL are recommended; pipeline and cloud concepts are introduced through HIGAET Practical Training.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a modeled warehouse schema, an orchestrated batch pipeline with quality checks, and a capstone platform combining ingestion, transformation, orchestration, and monitoring.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as data engineer, analytics engineer, ETL developer, data platform engineer, warehouse developer, BI engineer, and data operations engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Data Engineering | HIGAET Academy",
      description:
        "Design pipelines, warehouses, and streaming data systems in this intermediate HIGAET Academy course with hands-on data engineering projects.",
      keywords: [
        "data engineering",
        "etl pipelines",
        "data warehousing",
        "data modeling",
        "workflow orchestration",
        "streaming data",
        "sql",
        "data engineer roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_machine_learning",
    slug: "machine-learning",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET Machine Learning",
    summary:
      "Learn applied regression, classification, and model evaluation to train, tune, and compare machine learning models through HIGAET Practical Training projects.",
    duration: "12 weeks",
    level: "intermediate",
    mode: "hybrid",
    audience: [
      "Software developers",
      "Data scientists",
      "Data analysts",
      "AI engineers",
      "Backend developers",
      "Researchers",
    ],
    prerequisites: [
      "Comfortable with Python and core libraries",
      "Basic statistics and linear algebra",
      "Familiarity with tabular datasets",
    ],
    technologies: [
      "Python",
      "Scikit-learn",
      "Pandas",
      "NumPy",
      "XGBoost",
      "Jupyter",
      "Model evaluation tools",
    ],
    projects: [
      "Regression and ranking model",
      "Classification model comparison",
      "Feature preprocessing pipeline",
      "Validation and tuning study",
      "Capstone: Tuned ML model with evaluation report",
    ],
    skills: [
      "Supervised learning",
      "Feature preprocessing",
      "Model tuning",
      "Validation design",
      "Performance metrics",
      "Error analysis",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build supervised learning models for regression, classification, and ranking tasks",
      "Design validation strategies that prevent leakage and measure true generalization",
      "Develop preprocessing and feature pipelines for tabular, text, and time-based data",
      "Evaluate models using precision, recall, calibration, and business-aligned metrics",
      "Automate training and tuning workflows with tracked experiments and reproducible code",
      "Optimize algorithms through regularization, ensembles, and hyperparameter search",
      "Integrate trained models into simple services and batch scoring workflows",
      "Architect a complete modeling project with baselines, comparisons, and deployment notes",
    ],
    curriculum: [
      "Module 01 — Foundations: Machine Learning Concepts, Problem Types, and Evaluation Thinking",
      "Module 02 — Core: Data Preparation, Feature Engineering, and Baseline Modeling",
      "Module 03 — Core: Regression, Classification, and Probability Calibration",
      "Module 04 — Core: Tree Models, Ensembles, and Model Comparison Methods",
      "Module 05 — Engineering: Cross-Validation, Tuning, and Experiment Organization",
      "Module 06 — Engineering: Unsupervised Methods, Embeddings, and Feature Extraction",
      "Module 07 — Advanced: Time Series, Imbalanced Data, and Error Analysis",
      "Module 08 — Production: Model Packaging, Batch Scoring, and Responsible ML Review",
      "Module 09 — Capstone: End-to-End Machine Learning Model with Evaluation Report",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This intermediate course suits programmers and analysts with basic Python and statistics. Familiarity with dataframes and algebra helps; modeling theory is taught practically through HIGAET Practical Training and guided labs.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a baseline-to-tuned classifier, a regression and ensemble comparison study, and a capstone modeling project with validation, evaluation, and scoring workflow.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as machine learning engineer, data scientist, applied scientist, predictive modeler, AI engineer, analytics engineer, and research assistant.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Machine Learning | HIGAET Academy",
      description:
        "Build regression, classification, and ensemble models in this intermediate HIGAET Academy machine learning course with applied model projects.",
      keywords: [
        "machine learning",
        "supervised learning",
        "model evaluation",
        "feature engineering",
        "ensemble methods",
        "scikit-learn",
        "hyperparameter tuning",
        "ml engineer roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_deep_learning_engineering",
    slug: "deep-learning-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET Deep Learning Engineering",
    summary:
      "Learn neural network design, training, and optimization with modern frameworks to build vision and sequence models through HIGAET Practical Training.",
    duration: "10 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "AI engineers",
      "ML engineers",
      "Data scientists",
      "Researchers",
      "Backend developers",
    ],
    prerequisites: [
      "Comfortable with Python and ML basics",
      "Familiarity with linear algebra and loss functions",
      "Basic model training concepts",
    ],
    technologies: [
      "Python",
      "PyTorch",
      "TensorFlow",
      "Keras",
      "Jupyter",
      "Pretrained models",
      "GPU training tools",
    ],
    projects: [
      "Image classification model",
      "Sequence model for text and signals",
      "Transfer learning workflow",
      "Training loop with checkpointing",
      "Capstone: Vision and sequence deep learning system",
    ],
    skills: [
      "Neural network design",
      "Model training",
      "Transfer learning",
      "Hyperparameter tuning",
      "Overfitting diagnostics",
      "Task metrics analysis",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build convolutional and sequence models for image, text, and signal tasks",
      "Design training loops with loss functions, optimizers, schedulers, and checkpointing",
      "Develop transfer learning workflows using pretrained backbones and fine-tuning",
      "Evaluate deep models with task metrics, confusion analysis, and overfitting diagnostics",
      "Automate training runs with configuration management and experiment tracking",
      "Optimize models through augmentation, regularization, mixed precision, and early stopping",
      "Integrate trained models into inference scripts and lightweight serving endpoints",
      "Architect a documented deep learning project with datasets, baselines, and tuning history",
    ],
    curriculum: [
      "Module 01 — Foundations: Neural Networks, Gradient Descent, and Modern Framework Workflows",
      "Module 02 — Core: Convolutional Networks for Image Classification and Detection Basics",
      "Module 03 — Core: Sequence Models, Attention Concepts, and Text Representations",
      "Module 04 — Engineering: Datasets, Augmentation, Loaders, and Training Pipelines",
      "Module 05 — Engineering: Transfer Learning, Fine-Tuning, and Pretrained Models",
      "Module 06 — Advanced: Regularization, Optimization, and Debugging Training Failures",
      "Module 07 — Advanced: Model Compression, Quantization, and Inference Optimization",
      "Module 08 — Capstone: Deep Learning Application with Training Report and Demo",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This advanced course suits ML practitioners and engineers comfortable with Python and basic modeling. Prior machine learning exposure and linear algebra basics help; framework skills are strengthened through HIGAET Practical Training.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build an image classifier with transfer learning, a text sequence model, and a capstone deep learning application with training logs, evaluation, and an inference demo.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as deep learning engineer, computer vision engineer, NLP engineer, applied AI engineer, ML engineer, perception engineer, and research engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Deep Learning | HIGAET Academy",
      description:
        "Engineer neural networks with PyTorch and TensorFlow in this advanced HIGAET Academy course covering applied training, tuning, and deployment work.",
      keywords: [
        "deep learning",
        "neural networks",
        "pytorch",
        "tensorflow",
        "computer vision",
        "nlp models",
        "transfer learning",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_mlops",
    slug: "mlops",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET MLOps",
    summary:
      "Learn pipelines, registries, and deployment automation to operate reliable machine learning systems with monitoring and incident response through HIGAET Practical Training.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "ML engineers",
      "DevOps practitioners",
      "Software developers",
      "Data engineers",
      "Cloud engineers",
      "Platform engineers",
    ],
    prerequisites: [
      "Comfortable with Python and ML model basics",
      "Familiarity with Git and CI concepts",
      "Basic cloud and container awareness",
    ],
    technologies: [
      "Python",
      "MLflow",
      "Docker",
      "Kubernetes",
      "CI/CD tools",
      "Model registries",
      "Monitoring tools",
    ],
    projects: [
      "Versioned training pipeline",
      "Model registry with promotion workflow",
      "CI/CD release for ML service",
      "Drift detection and rollback setup",
      "Capstone: Monitored production ML pipeline with incident response",
    ],
    skills: [
      "Pipeline automation",
      "Model versioning",
      "CI/CD workflows",
      "Deployment automation",
      "Drift detection",
      "Rollback planning",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build automated training pipelines with versioned data, code, and artifacts",
      "Design model registries and promotion workflows across staging and production",
      "Develop CI and CD workflows for testing, packaging, and releasing ML services",
      "Evaluate production models with drift detection, quality gates, and rollback criteria",
      "Automate retraining triggers, batch scoring, and endpoint deployment routines",
      "Optimize inference cost, latency, and resource use for serving workloads",
      "Integrate feature stores and observability tooling into ML platforms",
      "Secure model services with access controls, audit trails, and environment isolation",
    ],
    curriculum: [
      "Module 01 — Foundations: MLOps Lifecycle, Environments, and Production Readiness",
      "Module 02 — Core: Experiment Tracking, Versioning, and Reproducible Training",
      "Module 03 — Core: Model Registries, Approval Gates, and Release Management",
      "Module 04 — Engineering: CI and CD Pipelines for Machine Learning Services",
      "Module 05 — Engineering: Feature Stores, Data Versioning, and Training Automation",
      "Module 06 — Advanced: Deployment Strategies, Scaling, and Inference Management",
      "Module 07 — Production: Monitoring, Drift Detection, Alerting, and Incident Response",
      "Module 08 — Capstone: Production MLOps Pipeline with Registry and Monitoring",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This advanced course suits ML engineers and backend developers operating models in production. Familiarity with Python, containers, and basic modeling is recommended; platform tooling is taught through HIGAET Practical Training.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a tracked training pipeline, a registry-backed release workflow, and a capstone MLOps system with CI, deployment, monitoring dashboards, and rollback procedures.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as MLOps engineer, ML platform engineer, applied ML engineer, DevOps for AI engineer, data engineer, backend engineer, and site reliability engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "MLOps | HIGAET Academy",
      description:
        "Operate production ML with pipelines, registries, and monitoring in this advanced HIGAET Academy MLOps course with hands-on platform projects.",
      keywords: [
        "mlops",
        "ml pipelines",
        "model registry",
        "experiment tracking",
        "ci cd for ml",
        "model monitoring",
        "feature store",
        "ml platform roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_analytics",
    slug: "ai-analytics",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET AI Analytics",
    summary:
      "Learn to combine analytics with generative AI to automate reporting, build assistants, and deliver faster insights through HIGAET Practical Training.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Data analysts",
      "Product managers",
      "Operations staff",
      "Career changers",
      "Entrepreneurs",
      "Students",
    ],
    prerequisites: [
      "No previous AI experience required",
      "Basic SQL and spreadsheet comfort",
      "Familiarity with business reports and dashboards",
    ],
    technologies: [
      "SQL",
      "Python",
      "Large language models",
      "Prompt engineering tools",
      "Retrieval workflows",
      "BI dashboards",
      "Reporting automation",
    ],
    projects: [
      "AI-assisted trend summary dashboard",
      "Business data Q&A assistant",
      "Automated reporting pipeline",
      "AI insight accuracy review",
      "Capstone: AI-powered analytics reporting system",
    ],
    skills: [
      "Prompt design",
      "Dashboard summarization",
      "Reporting automation",
      "Retrieval workflows",
      "Insight validation",
      "Business communication",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build AI-assisted dashboards that summarize trends and highlight key drivers",
      "Design prompts and retrieval workflows that answer questions over business data",
      "Develop automated reporting pipelines combining SQL, Python, and language models",
      "Evaluate AI-generated insights for accuracy, grounding, and business relevance",
      "Automate insight briefs, alerts, and executive summaries from live metrics",
      "Optimize analytics workflows by pairing statistical checks with AI drafting",
      "Integrate chat-based data assistants with governed datasets and guardrails",
      "Secure AI analytics workflows with privacy controls and source citations",
    ],
    curriculum: [
      "Module 01 — Foundations: AI-Augmented Analytics, Use Cases, and Responsible Practices",
      "Module 02 — Core: Prompt Design and Grounded Question Answering over Data",
      "Module 03 — Core: Retrieval Workflows for Reports, Metrics, and Documents",
      "Module 04 — Engineering: Automated Reporting with SQL, Python, and Language Models",
      "Module 05 — Engineering: Data Assistants, Agents, and Dashboard Integration",
      "Module 06 — Advanced: Evaluation, Hallucination Control, and Human Review Loops",
      "Module 07 — Production: Privacy, Governance, and Deployment of AI Analytics",
      "Module 08 — Capstone: AI Analytics Assistant with Reports and Live Dashboard",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This intermediate course suits analysts and product professionals familiar with dashboards and spreadsheets. Basic SQL or Python helps but is not mandatory; AI workflows are introduced practically through HIGAET Practical Training.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build an automated insight-report generator, a grounded data Q&A assistant, and a capstone AI analytics dashboard with assistant integration and review controls.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as AI analytics specialist, business intelligence analyst, product analyst, data analyst, insights analyst, reporting engineer, and analytics consultant.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Analytics | HIGAET Academy",
      description:
        "Apply generative AI to dashboards, reporting, and insights in this intermediate HIGAET Academy course with practical AI-assisted analytics work.",
      keywords: [
        "ai analytics",
        "generative ai",
        "data assistants",
        "automated reporting",
        "prompt engineering",
        "retrieval augmented generation",
        "dashboards",
        "analytics roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ml_engineering",
    slug: "ml-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET ML Engineering",
    summary:
      "Learn to design reliable production machine learning services with APIs, orchestration, and observability through HIGAET Practical Training.",
    duration: "12 weeks",
    level: "advanced",
    mode: "hybrid",
    audience: [
      "Software developers",
      "ML engineers",
      "Backend developers",
      "DevOps practitioners",
      "Cloud engineers",
      "Platform engineers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Familiarity with ML model basics",
      "Basic testing and container concepts",
    ],
    technologies: [
      "Python",
      "FastAPI",
      "Docker",
      "Kubernetes",
      "MLflow",
      "Orchestration tools",
      "Observability tools",
    ],
    projects: [
      "ML inference API service",
      "Batch inference job",
      "Model and data test suite",
      "Load and latency readiness check",
      "Capstone: Production ML service with observability",
    ],
    skills: [
      "API development",
      "System architecture",
      "Model testing",
      "Batch processing",
      "Latency budgeting",
      "Service observability",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build production ML services with APIs, batch jobs, and versioned artifacts",
      "Design system architectures covering data flow, inference paths, and failure handling",
      "Develop testing suites for data, features, models, and service contracts",
      "Evaluate service readiness with load tests, latency budgets, and quality thresholds",
      "Automate build, test, and release workflows for ML applications",
      "Optimize serving performance through caching, batching, and resource sizing",
      "Integrate observability with logging, metrics, tracing, and model telemetry",
      "Secure ML endpoints with authentication, rate limits, and input validation",
    ],
    curriculum: [
      "Module 01 — Foundations: ML Systems Design, Service Patterns, and Production Constraints",
      "Module 02 — Core: APIs, Batch Scoring, and Model Interface Design",
      "Module 03 — Core: Data Validation, Feature Pipelines, and Contract Testing",
      "Module 04 — Engineering: Containers, Orchestration, and Environment Management",
      "Module 05 — Engineering: Testing, Release Strategies, and Rollback Planning",
      "Module 06 — Advanced: Scaling, Caching, Queues, and Performance Engineering",
      "Module 07 — Advanced: Observability, Logging, and Production Debugging",
      "Module 08 — Production: Security, Cost Control, and Lifecycle Maintenance",
      "Module 09 — Capstone: Production ML Service with Tests and Observability",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This advanced course suits software and ML engineers with Python and API experience. Basic modeling knowledge is expected; systems design and deployment skills are developed through HIGAET Practical Training.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a tested model API, a batch scoring workflow, and a capstone production ML service with orchestration, observability, and documented release procedures.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as ML engineer, AI platform engineer, backend engineer, applied scientist, MLOps engineer, data engineer, and software engineer in AI.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "ML Engineering | HIGAET Academy",
      description:
        "Ship production ML systems with APIs, testing, scaling, and monitoring in this advanced HIGAET Academy course with end-to-end engineering projects.",
      keywords: [
        "ml engineering",
        "model serving",
        "ml apis",
        "production ml",
        "containers",
        "orchestration",
        "observability",
        "ml engineer roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_data_architecture",
    slug: "data-architecture",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET Data Architecture",
    summary:
      "Learn data modeling, platform design, and governance to plan warehouses, lakehouses, and enterprise standards and cataloging practices through HIGAET Practical Training.",
    duration: "8 weeks",
    level: "professional",
    mode: "online",
    audience: [
      "Data engineers",
      "Technology leaders",
      "Engineering managers",
      "Cloud engineers",
      "IT administrators",
      "Data analysts",
    ],
    prerequisites: [
      "Familiarity with databases and SQL",
      "Basic analytics or warehouse concepts",
      "Awareness of data lifecycle stages",
    ],
    technologies: [
      "SQL",
      "Data warehouses",
      "Lakehouse platforms",
      "Data modeling tools",
      "Data catalogs",
      "Lineage tools",
      "Governance frameworks",
    ],
    projects: [
      "Conceptual and logical data model",
      "Warehouse and lakehouse design",
      "Governance and retention framework",
      "Platform tradeoff evaluation",
      "Capstone: Enterprise data platform blueprint with catalog",
    ],
    skills: [
      "Data modeling",
      "Platform design",
      "Governance planning",
      "Metadata cataloging",
      "SLA definition",
      "Tradeoff analysis",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build conceptual and logical data models for transactional and analytical domains",
      "Design warehouse and lakehouse architectures with zones, contracts, and SLAs",
      "Develop governance frameworks covering quality, lineage, ownership, and retention",
      "Evaluate platform tradeoffs across cost, latency, scalability, and maintainability",
      "Automate metadata, cataloging, and documentation workflows for data assets",
      "Optimize storage and access patterns for analytics and operational consumers",
      "Integrate security, privacy, and compliance controls into platform blueprints",
      "Architect an enterprise data strategy with roadmaps and migration phases",
    ],
    curriculum: [
      "Module 01 — Foundations: Data Architecture Roles, Viewpoints, and Design Principles",
      "Module 02 — Core: Conceptual, Logical, and Physical Modeling Techniques",
      "Module 03 — Core: Warehouses, Lakes, Lakehouses, and Serving Layers",
      "Module 04 — Engineering: Integration Patterns, Contracts, and Master Data Concepts",
      "Module 05 — Engineering: Metadata, Catalogs, Lineage, and Discoverability",
      "Module 06 — Advanced: Governance, Quality Frameworks, and Stewardship Models",
      "Module 07 — Production: Security, Compliance, Cost Design, and Platform Operations",
      "Module 08 — Capstone: Enterprise Data Architecture Blueprint and Review Board",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This professional course suits senior engineers, analysts, and technology leads designing data platforms. Experience with databases or pipelines is recommended; strategy methods are taught through HIGAET Practical Training.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a domain data model, a governance and catalog plan, and a capstone enterprise architecture blueprint with platform diagrams, standards, and migration roadmap.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as data architect, enterprise data manager, data platform architect, analytics architect, data governance lead, and solutions architect.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Data Architecture | HIGAET Academy",
      description:
        "Design enterprise data platforms, governance, and modeling in this professional HIGAET Academy course with architecture blueprints and reviews.",
      keywords: [
        "data architecture",
        "data modeling",
        "data governance",
        "lakehouse architecture",
        "metadata catalog",
        "data strategy",
        "enterprise data",
        "data architect roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_big_data_engineering",
    slug: "big-data-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET Big Data Engineering",
    summary:
      "Learn reliable Spark, Kafka, and lakehouse systems to process large-scale batch and streaming data reliably through HIGAET Practical Training projects.",
    duration: "10 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Data engineers",
      "Backend developers",
      "Software developers",
      "Cloud engineers",
      "Platform engineers",
      "IT administrators",
    ],
    prerequisites: [
      "Comfortable with Python and SQL",
      "Familiarity with distributed concepts",
      "Basic data pipeline awareness",
    ],
    technologies: [
      "Apache Spark",
      "Apache Kafka",
      "Lakehouse tables",
      "Python",
      "SQL",
      "Streaming processors",
      "Cluster resource tools",
    ],
    projects: [
      "Partitioned batch processing job",
      "Streaming topology with watermarks",
      "Lakehouse table with time travel",
      "Job performance tuning study",
      "Capstone: Batch and streaming lakehouse system",
    ],
    skills: [
      "Distributed processing",
      "Stream processing",
      "Partition design",
      "Schema evolution",
      "Performance profiling",
      "Fault tolerance",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build distributed batch jobs that process large datasets with partitioning and fault tolerance",
      "Design streaming topologies with windows, watermarks, and exactly-once handling",
      "Develop lakehouse tables with schema evolution, compaction, and time travel",
      "Evaluate job performance using metrics, skew analysis, and resource profiling",
      "Automate cluster workflows with scheduling, retries, and environment templates",
      "Optimize shuffle, storage formats, and query plans for cost and speed",
      "Integrate batch and streaming layers into unified analytics-ready outputs",
      "Secure big data workloads with encryption, access policies, and audit logging",
    ],
    curriculum: [
      "Module 01 — Foundations: Distributed Systems, Batch Versus Streaming, and Storage Formats",
      "Module 02 — Core: Distributed Processing Models, Partitions, and Fault Tolerance",
      "Module 03 — Core: Batch Engineering with Large-Scale Frames and SQL Engines",
      "Module 04 — Engineering: Lakehouse Tables, Partitioning, and Incremental Processing",
      "Module 05 — Engineering: Event Streaming, Messaging, and Stream Processing",
      "Module 06 — Advanced: Stateful Streaming, Windows, Joins, and Late Data",
      "Module 07 — Advanced: Performance Tuning, Skew Handling, and Cost Optimization",
      "Module 08 — Production: Security, Monitoring, and Operations for Data Clusters",
      "Module 09 — Capstone: Unified Batch and Streaming Platform with Lakehouse Output",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This advanced course suits data engineers and backend developers handling large-scale workloads. Python and SQL plus basic data pipeline experience are recommended; distributed concepts are taught through HIGAET Practical Training.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a distributed batch processing job, a streaming pipeline with windowed outputs, and a capstone unified platform combining batch, streaming, and lakehouse tables.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as big data engineer, streaming data engineer, data platform engineer, Spark developer, data infrastructure engineer, and analytics engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Big Data Engineering | HIGAET Academy",
      description:
        "Process massive datasets with Spark, Kafka, and lakehouse platforms in this advanced HIGAET Academy course with scalable big data engineering labs.",
      keywords: [
        "big data engineering",
        "apache spark",
        "kafka streaming",
        "lakehouse",
        "distributed systems",
        "stream processing",
        "data pipelines",
        "big data roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_applied_machine_learning",
    slug: "applied-machine-learning",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_data_ml",
    title: "HIGAET Applied Machine Learning",
    summary:
      "Learn practical applied modeling, feature engineering, and evaluation to solve business problems and deploy useful models through HIGAET Practical Training.",
    duration: "10 weeks",
    level: "intermediate",
    mode: "hybrid",
    audience: [
      "Software developers",
      "Data analysts",
      "Data scientists",
      "Product managers",
      "Operations staff",
      "Entrepreneurs",
    ],
    prerequisites: [
      "Comfortable with Python basics",
      "Familiarity with business datasets",
      "Basic statistics awareness",
    ],
    technologies: [
      "Python",
      "Scikit-learn",
      "Pandas",
      "Jupyter",
      "Feature engineering tools",
      "Model evaluation tools",
      "Deployment handoff tools",
    ],
    projects: [
      "Churn prediction model",
      "Demand forecasting model",
      "Scoring and recommendation prototype",
      "Business metric evaluation study",
      "Capstone: Business ML solution with stakeholder review",
    ],
    skills: [
      "Applied modeling",
      "Feature engineering",
      "Use-case scoping",
      "Business metrics",
      "Model validation",
      "Solution handoff",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build applied models for churn, demand, scoring, and recommendation-style problems",
      "Design scoped ML use cases with success metrics and feasibility checks",
      "Develop end-to-end workflows from data collection to validation and handoff",
      "Evaluate solutions with business metrics, ablations, and stakeholder review",
      "Automate reporting and refresh routines for applied modeling workflows",
      "Optimize practical tradeoffs among accuracy, latency, cost, and maintainability",
      "Integrate models into dashboards, tools, and operational workflows",
      "Architect a portfolio-ready applied ML case study with limitations and next steps",
    ],
    curriculum: [
      "Module 01 — Foundations: Applied ML Scoping, Metrics, and Solution Design",
      "Module 02 — Core: Data Sourcing, Labeling Concepts, and Practical Preparation",
      "Module 03 — Core: Feature Engineering for Tabular and Text Business Data",
      "Module 04 — Core: Baselines, Model Selection, and Applied Evaluation",
      "Module 05 — Engineering: Tuning, Validation, and Responsible Applied Modeling",
      "Module 06 — Engineering: Prototypes, Dashboards, and Workflow Integration",
      "Module 07 — Advanced: Pilot Design, Feedback Loops, and Iteration Planning",
      "Module 08 — Production: Handoff, Documentation, and Maintenance Planning",
      "Module 09 — Capstone: Applied ML Solution with Prototype and Business Report",
    ],
    faqs: [
      {
        question: "Who should take this course and what prerequisites are needed?",
        answer:
          "This intermediate course suits analysts, developers, and domain specialists applying ML to real workflows. Basic Python and data handling help; solution design is taught hands-on through HIGAET Practical Training.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a scoped business ML prototype, an evaluation and iteration report, and a capstone applied solution with working prototype, metrics, and deployment handoff plan.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as applied ML engineer, data scientist, product analyst, business intelligence engineer, AI solutions analyst, automation analyst, and analytics engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Applied ML | HIGAET Academy",
      description:
        "Solve business problems with applied ML workflows in this intermediate HIGAET Academy course covering practical modeling, evaluation, and deployment.",
      keywords: [
        "applied machine learning",
        "business ml",
        "model prototyping",
        "feature engineering",
        "model evaluation",
        "ml deployment",
        "practical ai",
        "applied ml roles",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_cybersecurity_engineering",
    slug: "cybersecurity-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET Cybersecurity Engineering",
    summary:
      "Learn defensive security foundations and build hardened lab networks, secure endpoints, and monitoring workflows through guided HIGAET Practical Training / Experiential Learning.",
    duration: "12 weeks",
    level: "beginner",
    mode: "hybrid",
    audience: [
      "Students",
      "Career changers",
      "IT administrators",
      "Operations staff",
      "Software developers",
      "Security practitioners",
    ],
    prerequisites: [
      "No previous security experience required",
      "Basic computer and networking familiarity",
      "Comfort using Windows and Linux desktops",
      "Willingness to work in virtual lab environments",
    ],
    technologies: [
      "VirtualBox",
      "Linux baselines",
      "Windows hardening checklists",
      "Wireshark",
      "Open-source log dashboards",
      "Vulnerability scanners",
      "Remediation tracking boards",
    ],
    projects: [
      "Segmented virtual lab network",
      "Endpoint hardening checklist pack",
      "Security monitoring dashboard",
      "Vulnerability scan and remediation tracker",
      "Capstone: Hardened lab network with monitoring and remediation workflow",
    ],
    skills: [
      "Network segmentation",
      "Endpoint hardening",
      "Security baselines",
      "Log monitoring",
      "Vulnerability scanning",
      "Remediation tracking",
      "Lab documentation",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build hardened virtual lab networks with segmented zones and baselines",
      "Design endpoint hardening checklists for Windows and Linux lab systems",
      "Develop security monitoring dashboards using open-source log tooling",
      "Deploy vulnerability scanning workflows and remediation tracking boards",
      "Integrate identity hygiene controls including MFA and least privilege",
      "Evaluate security alerts and document defensive findings clearly",
      "Secure web and network services using defensive configuration patterns",
      "Automate routine security checks with scripts and scheduled tasks",
    ],
    curriculum: [
      "Module 01 — Foundations: Security principles, threats, and defense models",
      "Module 02 — Lab Setup: Virtual networks and isolated practice environments",
      "Module 03 — System Hardening: OS baselines and secure configuration",
      "Module 04 — Core: Networking, firewalls, and segmentation defenses",
      "Module 05 — Engineering: Vulnerability assessment and patch workflows",
      "Module 06 — Detection Basics: Logs, alerts, and monitoring fundamentals",
      "Module 07 — Identity Defense: Passwords, MFA, and access hygiene",
      "Module 08 — Applied Defense: Secure services and backup resilience",
      "Module 09 — Capstone: Hardened lab network with monitoring and report",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Beginners interested in defensive security roles. Basic computer skills and familiarity with operating systems are helpful. No prior security experience is required.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a segmented virtual lab network, an endpoint hardening checklist project, and a capstone with monitoring dashboards plus a remediation report through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as security analyst, security operations associate, IT support specialist, network technician, systems administrator, compliance assistant, and security technician.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Cybersecurity Engineering | HIGAET Academy",
      description:
        "Beginner cybersecurity engineering course covering lab networks, hardening, vulnerability workflows, and defensive monitoring with practical projects.",
      keywords: [
        "cybersecurity fundamentals",
        "network defense",
        "system hardening",
        "vulnerability management",
        "security monitoring",
        "firewalls",
        "lab environments",
        "security analyst",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_cloud_security",
    slug: "cloud-security",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET Cloud Security",
    summary:
      "Learn to secure cloud accounts, storage, and workloads while building identity policies, logging pipelines, and misconfiguration reviews in controlled labs.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Cloud engineers",
      "DevOps practitioners",
      "Security practitioners",
      "Backend developers",
      "IT administrators",
    ],
    prerequisites: [
      "Familiarity with basic cloud concepts",
      "Comfort with command line and web consoles",
      "Understanding of users, roles, and permissions",
    ],
    technologies: [
      "AWS IAM",
      "Cloud storage controls",
      "Virtual network controls",
      "Cloud logging pipelines",
      "Alerting rules",
      "Misconfiguration checklists",
      "Least-privilege policies",
    ],
    projects: [
      "Secure cloud lab account with guardrails",
      "Least-privilege identity policy set",
      "Storage and network controls lab",
      "Centralized logging and alerting pipeline",
      "Capstone: Secured cloud workload with identity, controls, and activity alerting",
    ],
    skills: [
      "Cloud identity policy design",
      "Least-privilege access",
      "Storage security controls",
      "Network security controls",
      "Centralized logging",
      "Misconfiguration review",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build secure cloud lab accounts with organized projects and guardrails",
      "Design identity and access policies using least-privilege principles",
      "Develop storage and network security controls for lab workloads",
      "Deploy centralized logging and alerting for cloud activity",
      "Integrate automated misconfiguration checks into review workflows",
      "Evaluate shared responsibility models across service types",
      "Secure containers and serverless functions with defensive baselines",
      "Automate compliance checks with policy-as-code templates",
    ],
    curriculum: [
      "Module 01 — Foundations: Cloud models and shared responsibility",
      "Module 02 — Identity: IAM users, roles, and least privilege",
      "Module 03 — Network Defense: Virtual networks, groups, and filtering",
      "Module 04 — Core: Storage encryption and key handling",
      "Module 05 — Engineering: Workload hardening for VMs and containers",
      "Module 06 — Visibility: Logging, auditing, and alert design",
      "Module 07 — Posture Review: Benchmarks and misconfiguration response",
      "Module 08 — Capstone: Secured cloud lab with policy checks and report",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Learners with basic cloud and networking familiarity. Prior completion of an introductory IT or cybersecurity course is helpful but not mandatory.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a secured cloud lab account, an IAM policy set, and a capstone with logging, posture checks, and a findings report through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as cloud security analyst, cloud administrator, security engineer associate, compliance analyst, DevOps support engineer, SOC analyst, and systems engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Cloud Security | HIGAET Academy",
      description:
        "Intermediate cloud security course on IAM, storage defense, workload hardening, logging, and posture reviews using controlled cloud labs.",
      keywords: [
        "cloud security",
        "iam",
        "least privilege",
        "storage security",
        "cloud logging",
        "posture management",
        "containers",
        "policy as code",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_application_security",
    slug: "application-security",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET Application Security",
    summary:
      "Learn secure coding, authentication design, and defensive testing while building threat models, code reviews, and pipeline checks for sample applications.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Frontend developers",
      "Security practitioners",
      "Product managers",
    ],
    prerequisites: [
      "Comfort reading Python or JavaScript code",
      "Basic understanding of web apps and APIs",
      "Familiarity with HTTP requests and sessions",
    ],
    technologies: [
      "Threat modeling canvases",
      "Authentication controls",
      "Session handling patterns",
      "Input validation libraries",
      "Output encoding practices",
      "SAST scanners",
      "Dependency checkers",
    ],
    projects: [
      "Web app and API threat model",
      "Secure authentication and session design",
      "Input validation and output encoding defenses",
      "Lab pipeline with static and dependency checks",
      "Capstone: Secured sample app with threat model, auth controls, and pipeline checks",
    ],
    skills: [
      "Threat modeling",
      "Secure authentication design",
      "Session protection",
      "Input validation",
      "Output encoding",
      "Static analysis",
      "Dependency review",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build threat models for sample web applications and APIs",
      "Design secure authentication and session handling controls",
      "Develop input validation and output encoding defenses",
      "Deploy static and dependency checks in a lab pipeline",
      "Integrate security headers and defensive error handling",
      "Evaluate common web risks using defensive review checklists",
      "Secure APIs with authorization checks and rate controls",
      "Automate security test summaries for developer review",
    ],
    curriculum: [
      "Module 01 — Foundations: Application risks and secure design principles",
      "Module 02 — Threat Modeling: Assets, trust boundaries, and abuse cases",
      "Module 03 — Identity: Authentication, sessions, and password defense",
      "Module 04 — Core: Input handling, injection defenses, and encoding",
      "Module 05 — Engineering: Access control and API security patterns",
      "Module 06 — Pipeline Checks: Static analysis and dependency review",
      "Module 07 — Defensive Testing: Controlled review and report writing",
      "Module 08 — Capstone: Secured sample app with threat model and checks",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Learners with basic programming or web fundamentals. Familiarity with HTTP, HTML, and one programming language will help with lab exercises.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a threat model, a secure coding review pack, and a capstone securing a sample app with pipeline checks through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as application security analyst, secure code reviewer, software engineer, QA security tester, API developer, DevOps engineer, and security consultant associate.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Application Security | HIGAET Academy",
      description:
        "Intermediate application security course covering threat modeling, secure coding, API defenses, and pipeline checks for sample apps.",
      keywords: [
        "application security",
        "secure coding",
        "threat modeling",
        "api security",
        "owasp awareness",
        "static analysis",
        "authentication",
        "secure development",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_ai_security",
    slug: "ai-security",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET AI Security",
    summary:
      "Learn defensive security for AI systems including prompt safeguards, data protection, model access controls, and evaluation of LLM behavior in labs.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "AI engineers",
      "ML engineers",
      "Software developers",
      "Data engineers",
      "Security practitioners",
    ],
    prerequisites: [
      "Basic familiarity with LLM applications",
      "Comfort with Python and REST APIs",
      "Understanding of data pipelines and access controls",
    ],
    technologies: [
      "LLM input safeguards",
      "Output filtering patterns",
      "Data handling controls",
      "Retrieval pipeline guards",
      "Evaluation checklists",
      "Model access controls",
      "Endpoint logging",
    ],
    projects: [
      "LLM input and output safeguard kit",
      "Secure training and retrieval data controls",
      "Prompt risk evaluation checklist",
      "Model endpoint access and logging setup",
      "Capstone: Secured lab AI app with safeguards, data controls, and endpoint logging",
    ],
    skills: [
      "Prompt safeguard design",
      "Output review",
      "Training data protection",
      "Retrieval security",
      "Risk evaluation",
      "Model access control",
      "Endpoint logging",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build safeguard patterns for LLM inputs and outputs in lab apps",
      "Design data handling controls for training and retrieval pipelines",
      "Develop evaluation checklists for prompt injection and leakage risks",
      "Deploy access controls and logging for model endpoints",
      "Integrate content filters and human review gates",
      "Evaluate model theft, poisoning, and misuse risks defensively",
      "Secure RAG pipelines with source validation and redaction",
      "Automate safety regression checks for AI application updates",
    ],
    curriculum: [
      "Module 01 — Foundations: AI system components and trust boundaries",
      "Module 02 — Data Defense: Dataset provenance and privacy controls",
      "Module 03 — Prompt Safeguards: Injection awareness and defensive design",
      "Module 04 — Core: Model access control and endpoint logging",
      "Module 05 — Engineering: RAG security and retrieval validation",
      "Module 06 — Evaluation: Safety testing and guardrail measurement",
      "Module 07 — Advanced: Controlled red-teaming methods and reporting",
      "Module 08 — Capstone: Guardrailed lab AI app with safety evaluation",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Advanced learners with Python and basic machine learning or LLM application familiarity. Prior application security knowledge is strongly recommended.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build input-output safeguard rules, a RAG protection review, and a capstone guardrailed AI app with evaluation notes through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as AI security analyst, LLM application engineer, security engineer, trust and safety analyst, data engineer, MLOps associate, and product security analyst.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "AI Security | HIGAET Academy",
      description:
        "Advanced AI security course on prompt safeguards, RAG protection, model access controls, and safety evaluation for lab AI apps.",
      keywords: [
        "ai security",
        "llm guardrails",
        "prompt injection defense",
        "rag security",
        "model risk",
        "data poisoning awareness",
        "ai evaluation",
        "trust and safety",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_soc_engineering",
    slug: "soc-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET SOC Engineering",
    summary:
      "Learn security operations workflows and build SIEM dashboards, detection rules, triage playbooks, and incident timelines using simulated log data.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Security practitioners",
      "Operations staff",
      "IT administrators",
      "Data analysts",
      "Career changers",
    ],
    prerequisites: [
      "No previous SOC experience required",
      "Basic log and networking familiarity",
      "Comfort with dashboards and ticketing workflows",
    ],
    technologies: [
      "SIEM dashboards",
      "Detection rules",
      "Alert tuning notes",
      "Triage playbooks",
      "Case management boards",
      "Severity and SLA trackers",
      "Timeline builders",
    ],
    projects: [
      "SIEM dashboard from simulated logs",
      "Tuned detection rule set",
      "Alert triage playbook pack",
      "Case management workflow with SLAs",
      "Capstone: SOC workflow with dashboards, detections, playbooks, and case timelines",
    ],
    skills: [
      "SIEM dashboarding",
      "Detection rule design",
      "Alert tuning",
      "Triage workflows",
      "Playbook writing",
      "Case management",
      "Incident timelines",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build SIEM dashboards from simulated endpoint and network logs",
      "Design detection rules with tuning notes to reduce noise",
      "Develop triage playbooks for common alert categories",
      "Deploy case management workflows with severity and SLAs",
      "Integrate threat intelligence feeds into review processes",
      "Evaluate incidents and document timelines with evidence",
      "Secure log collection pipelines with parsing and retention rules",
      "Automate enrichment and notification steps for analyst queues",
    ],
    curriculum: [
      "Module 01 — Foundations: SOC roles, tiers, and operations flow",
      "Module 02 — Log Engineering: Sources, parsing, and normalization",
      "Module 03 — SIEM Practice: Queries, dashboards, and alert design",
      "Module 04 — Core: Detection engineering and rule tuning",
      "Module 05 — Triage: Playbooks, prioritization, and case handling",
      "Module 06 — Intelligence: Threat feeds and contextual analysis",
      "Module 07 — Response: Containment coordination and recovery notes",
      "Module 08 — Capstone: SOC lab with detections, playbook, and case report",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Learners with basic networking and security familiarity. Comfort reading logs and following structured procedures will help with simulations.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build SIEM dashboards, tuned detection rules, and a capstone SOC case with timeline and playbook through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as SOC analyst, detection analyst, incident response associate, threat intelligence analyst, security engineer, network defender, and security consultant.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "SOC Engineering | HIGAET Academy",
      description:
        "Intermediate SOC course on SIEM, detection engineering, triage playbooks, threat intel, and incident timelines with lab data.",
      keywords: [
        "soc",
        "siem",
        "detection engineering",
        "alert triage",
        "threat intelligence",
        "incident response",
        "playbooks",
        "log analysis",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_security_automation",
    slug: "security-automation",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET Security Automation",
    summary:
      "Learn to automate defensive security tasks and build alert enrichment, evidence collection, and reporting workflows with APIs and playbooks.",
    duration: "6 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Security practitioners",
      "DevOps practitioners",
      "Backend developers",
      "IT administrators",
      "Data engineers",
    ],
    prerequisites: [
      "Comfortable with Python and REST APIs",
      "Basic familiarity with logs and alerts",
      "Understanding of scheduled jobs and webhooks",
    ],
    technologies: [
      "Python automation scripts",
      "Log parsing utilities",
      "SOAR-style playbooks",
      "REST API integrations",
      "Enrichment workflows",
      "Scheduled jobs",
      "Posture check templates",
    ],
    projects: [
      "Log collection and parsing scripts",
      "Enrichment and escalation playbook",
      "Lab tool API integration",
      "Scheduled hygiene and posture checks",
      "Capstone: Automated defensive workflow with enrichment, evidence collection, and reporting",
    ],
    skills: [
      "Log automation",
      "Playbook design",
      "API integration",
      "Alert enrichment",
      "Evidence collection",
      "Scheduled reporting",
      "Posture checks",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Build automation scripts for log collection and parsing tasks",
      "Design SOAR-style playbooks for enrichment and escalation",
      "Develop API integrations between security lab tools",
      "Deploy scheduled jobs for hygiene and posture checks",
      "Integrate ticketing updates with alert evidence packs",
      "Evaluate automation reliability with error handling and logs",
      "Secure automation credentials using vault patterns",
      "Automate weekly defensive reporting dashboards",
    ],
    curriculum: [
      "Module 01 — Foundations: Automation use cases and safety guardrails",
      "Module 02 — Scripting: Python patterns for defensive workflows",
      "Module 03 — APIs: Connecting lab security tools reliably",
      "Module 04 — Core: Playbook design and decision logic",
      "Module 05 — Engineering: Scheduling, retries, and failure handling",
      "Module 06 — Capstone: Automated triage pipeline with evidence report",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Advanced learners comfortable with Python and APIs. Prior SOC, cloud, or scripting exposure will make automation labs easier to follow.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build enrichment scripts, integration connectors, and a capstone automated triage pipeline with reports through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as security automation engineer, SOC engineer, detection engineer, security tools engineer, DevSecOps engineer, platform engineer, and security analyst.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Security Automation | HIGAET Academy",
      description:
        "Advanced security automation course on scripting, API integrations, playbooks, scheduling, and automated defensive reporting.",
      keywords: [
        "security automation",
        "soar playbooks",
        "python scripting",
        "api integration",
        "alert enrichment",
        "workflow design",
        "detection support",
        "devsecops",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_devsecops_security",
    slug: "devsecops-security",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET DevSecOps Security",
    summary:
      "Learn to embed defensive checks into delivery pipelines while building secret handling, image scanning, and deployment guardrails for sample services.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "DevOps practitioners",
      "Platform engineers",
      "Cloud engineers",
      "Backend developers",
      "Security practitioners",
    ],
    prerequisites: [
      "Familiarity with CI/CD pipelines and Git",
      "Basic container and cloud concepts",
      "Comfort with command line workflows",
    ],
    technologies: [
      "Pipeline security gates",
      "Secret managers",
      "Artifact protection",
      "Container image scanners",
      "Dependency scanners",
      "Infrastructure policy checks",
      "Deployment guardrails",
    ],
    projects: [
      "Pipeline with security gates and approvals",
      "Secret handling and artifact workflow",
      "Image and dependency scanning stage",
      "Infrastructure policy checks for labs",
      "Capstone: Secured delivery pipeline with gates, scanning, and deployment guardrails",
    ],
    skills: [
      "Pipeline security gates",
      "Secret handling",
      "Artifact protection",
      "Image scanning",
      "Dependency scanning",
      "Policy-as-code checks",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build pipeline stages with security gates and approvals",
      "Design secret handling and artifact protection workflows",
      "Develop container image and dependency scanning checks",
      "Deploy infrastructure policy checks for lab environments",
      "Integrate DAST-style defensive reviews into staging",
      "Evaluate pipeline failures and document remediation paths",
      "Secure CI runners and deployment credentials defensively",
      "Automate security summaries for release review meetings",
    ],
    curriculum: [
      "Module 01 — Foundations: DevSecOps models and pipeline risk points",
      "Module 02 — Source Defense: Branch controls and secret handling",
      "Module 03 — Build Checks: Dependencies and artifact protection",
      "Module 04 — Core: Container scanning and image baselines",
      "Module 05 — Engineering: Infrastructure policy and configuration checks",
      "Module 06 — Release: Deployment guardrails and approvals",
      "Module 07 — Observability: Post-release monitoring and feedback",
      "Module 08 — Capstone: Secured pipeline with gates and release report",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Advanced learners with Git, CI basics, and container familiarity. Prior Linux or cloud exposure will help with pipeline labs.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build scanned build workflows, policy checks, and a capstone secured pipeline with release evidence through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as DevSecOps engineer, platform engineer, cloud security engineer, release engineer, site reliability engineer, security engineer, and build engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "DevSecOps Security | HIGAET Academy",
      description:
        "Advanced DevSecOps course on pipeline gates, secret handling, container scanning, policy checks, and release guardrails.",
      keywords: [
        "devsecops",
        "ci cd security",
        "container scanning",
        "secrets management",
        "policy as code",
        "pipeline gates",
        "deployment safety",
        "platform security",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_cyber_defense_engineering",
    slug: "cyber-defense-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET Cyber Defense Engineering",
    summary:
      "Learn layered defense design and build network controls, endpoint defenses, deception sensors, and coordinated response drills in isolated labs.",
    duration: "10 weeks",
    level: "advanced",
    mode: "hybrid",
    audience: [
      "Security practitioners",
      "IT administrators",
      "Operations staff",
      "Cloud engineers",
      "Software developers",
    ],
    prerequisites: [
      "Basic networking and endpoint familiarity",
      "Comfort working in isolated virtual labs",
      "Understanding of logs and alerts",
    ],
    technologies: [
      "Network controls",
      "Endpoint defenses",
      "Detection coverage maps",
      "Honeypots",
      "Alerting sensors",
      "Response runbooks",
      "Telemetry dashboards",
    ],
    projects: [
      "Layered defense lab layout",
      "Network and host detection coverage map",
      "Isolated honeypot sensor deployment",
      "Coordinated response runbook set",
      "Capstone: Layered lab defense with controls, sensors, coverage maps, and response drill",
    ],
    skills: [
      "Layered defense design",
      "Network controls",
      "Endpoint defense",
      "Detection coverage mapping",
      "Deception sensors",
      "Response runbooks",
      "Drill coordination",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build layered defense layouts for lab networks and endpoints",
      "Design detection coverage maps across network and host telemetry",
      "Develop coordinated response runbooks for simulated scenarios",
      "Deploy honeypots and alerting sensors in isolated labs",
      "Integrate firewall, EDR, and log controls into one view",
      "Evaluate adversary tactics using defensive mapping frameworks",
      "Secure recovery workflows with backups and rehearsal checklists",
      "Automate evidence packaging for post-exercise reviews",
    ],
    curriculum: [
      "Module 01 — Foundations: Defense in depth and control families",
      "Module 02 — Network Defense: Segmentation, filtering, and monitoring",
      "Module 03 — Endpoint Defense: Baselines, allowlists, and EDR review",
      "Module 04 — Core: Detection mapping and coverage analysis",
      "Module 05 — Engineering: Deception sensors and alert validation",
      "Module 06 — Coordination: Response roles and communication drills",
      "Module 07 — Resilience: Backup, restore, and continuity checks",
      "Module 08 — Exercise: Controlled blue-team simulation and review",
      "Module 09 — Capstone: Integrated defense lab with exercise report",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Advanced learners with networking and SOC or systems fundamentals. This course uses only isolated lab environments for defensive drills.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build layered defense controls, deception sensors, and a capstone integrated defense exercise with findings through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as cyber defense engineer, SOC lead associate, incident responder, network security engineer, threat analyst, security architect associate, and defense consultant.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Cyber Defense Engineering | HIGAET",
      description:
        "Advanced cyber defense course on layered controls, detection mapping, deception sensors, and coordinated lab response drills.",
      keywords: [
        "cyber defense",
        "blue team",
        "detection mapping",
        "network security",
        "edr review",
        "deception technology",
        "incident drills",
        "resilience",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_identity_access_security",
    slug: "identity-and-access-security",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET Identity & Access Security",
    summary:
      "Learn identity-first defense and build MFA rollouts, lifecycle workflows, privileged access reviews, and directory monitoring in practice labs.",
    duration: "6 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "IT administrators",
      "Security practitioners",
      "Operations staff",
      "Cloud engineers",
      "Engineering managers",
    ],
    prerequisites: [
      "No previous identity security experience required",
      "Basic directory and user account familiarity",
      "Comfort with admin consoles and policies",
    ],
    technologies: [
      "Directory services",
      "Group and role design",
      "MFA policies",
      "Conditional access rules",
      "Lifecycle workflows",
      "Privileged access reviews",
      "Just-in-time controls",
    ],
    projects: [
      "Directory structure with roles and standards",
      "MFA and conditional access policy set",
      "Joiner-mover-leaver workflow with approvals",
      "Capstone: Identity-first defense with lifecycle workflows, MFA policies, and privileged access reviews",
    ],
    skills: [
      "Directory design",
      "Role modeling",
      "MFA rollout",
      "Conditional access",
      "Lifecycle workflows",
      "Privileged access review",
      "Directory monitoring",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Build directory structures with groups, roles, and naming standards",
      "Design MFA and conditional access policies for lab tenants",
      "Develop joiner-mover-leaver workflows with approval trails",
      "Deploy privileged access reviews and just-in-time controls",
      "Integrate single sign-on for sample lab applications",
      "Evaluate access logs for anomalous sign-in patterns",
      "Secure service accounts and API credentials defensively",
      "Automate access review reminders and evidence exports",
    ],
    curriculum: [
      "Module 01 — Foundations: Identity models and access principles",
      "Module 02 — Directories: Users, groups, and role design",
      "Module 03 — Authentication: MFA and conditional access",
      "Module 04 — Core: Lifecycle workflows and approvals",
      "Module 05 — Privilege: Reviews, vaulting, and session controls",
      "Module 06 — Capstone: Identity-hardened lab with review report",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Learners with basic IT administration familiarity. Experience with user accounts, directories, or helpdesk tasks will be useful.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build access policies, lifecycle workflows, and a capstone identity-hardened environment with review evidence through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as IAM analyst, identity engineer associate, systems administrator, IT support lead, security analyst, access reviewer, and compliance assistant.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Identity Access Security | HIGAET",
      description:
        "Intermediate identity security course on MFA, lifecycle workflows, privileged access reviews, and directory monitoring labs.",
      keywords: [
        "identity security",
        "iam",
        "mfa",
        "conditional access",
        "privileged access",
        "access review",
        "single sign on",
        "directory defense",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_security_architecture",
    slug: "security-architecture",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_cybersecurity",
    title: "HIGAET Security Architecture",
    summary:
      "Learn to design enterprise security architectures and produce reference models, control maps, zero-trust roadmaps, and executive-ready review documents.",
    duration: "10 weeks",
    level: "professional",
    mode: "online",
    audience: [
      "Security practitioners",
      "Technology leaders",
      "Engineering managers",
      "Cloud engineers",
      "Product managers",
      "Researchers",
    ],
    prerequisites: [
      "Familiarity with enterprise IT and cloud systems",
      "Understanding of risk, identity, and network basics",
      "Comfort reading architecture diagrams and requirements",
    ],
    technologies: [
      "Reference architectures",
      "Control mapping matrices",
      "Risk scenario templates",
      "Zero-trust roadmaps",
      "Architecture review templates",
      "Network zoning models",
      "Data zone patterns",
    ],
    projects: [
      "Identity, network, and data reference architecture",
      "Risk-aligned control map",
      "Phased zero-trust roadmap",
      "Architecture review template pack",
      "Capstone: Enterprise security architecture with reference model, control maps, and review documents",
    ],
    skills: [
      "Reference architecture design",
      "Control mapping",
      "Risk scenario analysis",
      "Zero-trust planning",
      "Zoning design",
      "Architecture reviews",
      "Executive documentation",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build reference architectures for identity, network, and data zones",
      "Design control maps aligned to risk scenarios and requirements",
      "Develop zero-trust roadmaps with phased defensive milestones",
      "Deploy architecture review templates for new systems",
      "Integrate logging and resilience patterns into designs",
      "Evaluate vendor proposals using structured security criteria",
      "Secure data flows with classification and protection patterns",
      "Architect executive summaries with risks, options, and next steps",
    ],
    curriculum: [
      "Module 01 — Foundations: Architecture domains and design methods",
      "Module 02 — Risk Framing: Assets, threats, and control objectives",
      "Module 03 — Identity Architecture: Enterprise access patterns",
      "Module 04 — Core: Network zones and secure connectivity",
      "Module 05 — Data Design: Classification, encryption, and retention",
      "Module 06 — Engineering: Logging, resilience, and recovery design",
      "Module 07 — Zero Trust: Segmentation and phased adoption plans",
      "Module 08 — Governance: Reviews, exceptions, and documentation",
      "Module 09 — Capstone: Enterprise security architecture pack and review",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Experienced professionals with security, infrastructure, or software background. Familiarity with risk concepts and enterprise systems is recommended.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build reference diagrams, a control map, and a capstone architecture pack with roadmap and review notes through HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "Supports awareness of roles such as security architect, enterprise architect, security consultant, cloud architect, risk analyst, compliance manager, CISO associate, and solutions architect.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Security Architecture | HIGAET Academy",
      description:
        "Professional security architecture course on reference models, control maps, zero-trust roadmaps, and architecture reviews.",
      keywords: [
        "security architecture",
        "zero trust",
        "control mapping",
        "reference architecture",
        "risk design",
        "enterprise security",
        "governance",
        "security reviews",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_blockchain_engineering",
    slug: "blockchain-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_emerging_tech",
    title: "HIGAET Blockchain Engineering",
    summary:
      "Learn distributed ledgers, consensus, smart contracts, and token standards while building secure decentralized applications through HIGAET Practical Training applied projects.",
    duration: "10 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Security practitioners",
      "Technology leaders",
      "Entrepreneurs",
      "Students",
    ],
    prerequisites: [
      "Comfortable with JavaScript or Python fundamentals",
      "Familiarity with APIs and JSON data",
      "Basic understanding of cryptography concepts",
    ],
    technologies: [
      "Ethereum",
      "Solidity",
      "Smart contracts",
      "ERC token standards",
      "Web3 wallets",
      "Test networks",
      "Node providers",
      "Contract verification tools",
    ],
    projects: [
      "Payment smart contract with access control",
      "Fungible and non-fungible token contracts",
      "Decentralized application with wallet integration",
      "Asset transfer dApp with node integration",
      "Capstone: Verified decentralized application deployed to test network",
    ],
    skills: [
      "Distributed ledgers",
      "Consensus mechanisms",
      "Smart contract development",
      "Token standards",
      "Decentralized applications",
      "Contract deployment",
      "Wallet integration",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build smart contracts for payments, access control, and asset transfers",
      "Design token standards for fungible and non-fungible digital assets",
      "Develop decentralized applications with wallet and node integration",
      "Deploy smart contracts to test networks with verification workflows",
      "Integrate blockchain explorers, oracles, and off-chain storage",
      "Evaluate consensus mechanisms for throughput, cost, and decentralization",
      "Secure contracts against reentrancy, overflow, and access flaws",
      "Automate contract testing, auditing checks, and deployment pipelines",
    ],
    curriculum: [
      "Module 01 — Foundations: distributed ledgers, cryptography, and network models",
      "Module 02 — Core: transactions, consensus, and Ethereum architecture",
      "Module 03 — Core: Solidity programming, accounts, and gas optimization",
      "Module 04 — Engineering: ERC token standards, wallets, and key management",
      "Module 05 — Engineering: decentralized applications, libraries, and node providers",
      "Module 06 — Advanced: oracles, bridges, layer-two scaling, and storage",
      "Module 07 — Advanced: security patterns, audits, and formal verification basics",
      "Module 08 — Production: testing, monitoring, upgrades, and governance",
      "Module 09 — Capstone: design, build, and deploy an audited decentralized application",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Software developers and technology students with JavaScript or Python fundamentals and basic web development skills. Familiarity with command-line tools and APIs is helpful. All practical work is completed as HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a wallet-connected token contract, a decentralized marketplace prototype, and a capstone decentralized application with tested, verified contracts, frontend integration, and deployment documentation.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as blockchain developer, smart contract developer, decentralized application developer, Web3 backend developer, token engineer, blockchain QA engineer, protocol analyst, and solutions engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Blockchain Engineering | HIGAET Academy",
      description:
        "Master blockchain ledgers, consensus, smart contracts, and token engineering while building secure decentralized applications with HIGAET Academy.",
      keywords: [
        "blockchain engineering",
        "smart contracts",
        "solidity",
        "token standards",
        "decentralized applications",
        "consensus mechanisms",
        "web3 developer",
        "contract security",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_web3_engineering",
    slug: "web3-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_emerging_tech",
    title: "HIGAET Web3 Engineering",
    summary:
      "Master wallets, decentralized identity, smart contract frontends, and NFT systems while engineering full-stack Web3 products through HIGAET Practical Training applied projects.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Frontend developers",
      "Software developers",
      "Product managers",
      "Entrepreneurs",
      "Students",
      "Career changers",
    ],
    prerequisites: [
      "Comfortable with JavaScript and frontend fundamentals",
      "Familiarity with APIs and JSON data",
      "Basic understanding of blockchain concepts",
    ],
    technologies: [
      "Web3 wallets",
      "Ethers.js",
      "Smart contract frontends",
      "Decentralized identity",
      "NFT standards",
      "Test networks",
      "IPFS",
      "React",
    ],
    projects: [
      "Wallet-connected frontend with transaction signing",
      "Signature-based decentralized identity login",
      "NFT minting and listing interface",
      "Capstone: Full-stack Web3 product with testnet contract integration",
    ],
    skills: [
      "Wallet integration",
      "Transaction signing flows",
      "Decentralized identity",
      "Smart contract frontends",
      "NFT systems",
      "Web3 product deployment",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build wallet-connected Web3 frontends with transaction signing flows",
      "Design decentralized identity and authentication using signatures",
      "Develop NFT minting, listing, and marketplace interactions",
      "Deploy Web3 frontends with testnet contract integrations",
      "Integrate IPFS storage, indexers, and price oracles",
      "Evaluate gas costs, wallet UX, and protocol trade-offs",
      "Secure frontend transactions against phishing and approval risks",
      "Automate contract interaction testing and release checks",
    ],
    curriculum: [
      "Module 01 — Foundations: Web3 architecture, wallets, and networks",
      "Module 02 — Core: accounts, signatures, transactions, and gas",
      "Module 03 — Core: contract ABIs, libraries, and frontend connections",
      "Module 04 — Engineering: decentralized identity, sessions, and permissions",
      "Module 05 — Engineering: NFTs, marketplaces, and metadata storage",
      "Module 06 — Advanced: indexing, notifications, and oracle data",
      "Module 07 — Production: security, testing, analytics, and deployment",
      "Module 08 — Capstone: launch a full-stack Web3 application on a test network",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Frontend or full-stack learners with HTML, CSS, JavaScript, and basic React knowledge. Prior blockchain exposure is useful but not required. Hands-on labs run as HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a wallet login application, an NFT collection with marketplace functions, and a capstone full-stack Web3 product with contract integration and deployed frontend.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as Web3 frontend developer, decentralized application developer, NFT platform developer, blockchain integration developer, product engineer, Web3 QA engineer, and technical support engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Web3 Engineering | HIGAET Academy",
      description:
        "Build web3 wallets, decentralized identities, smart contract frontends, and NFT marketplaces through applied engineering training at HIGAET Academy.",
      keywords: [
        "web3 engineering",
        "decentralized applications",
        "wallets",
        "nft marketplaces",
        "decentralized identity",
        "ipfs storage",
        "frontend development",
        "smart contract integration",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_iot_engineering",
    slug: "iot-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_emerging_tech",
    title: "HIGAET IoT Engineering",
    summary:
      "Learn sensors, microcontrollers, MQTT messaging, and telemetry pipelines while deploying connected monitoring solutions through HIGAET Practical Training applied device projects.",
    duration: "8 weeks",
    level: "intermediate",
    mode: "online",
    audience: [
      "Software developers",
      "Cloud engineers",
      "Operations staff",
      "IT administrators",
      "Students",
      "Career changers",
    ],
    prerequisites: [
      "No previous IoT experience required",
      "Basic Python familiarity helpful",
      "Comfortable with computers and networks",
    ],
    technologies: [
      "Microcontrollers",
      "Sensors",
      "MQTT",
      "HTTP messaging",
      "Firmware toolchains",
      "Cloud dashboards",
      "Time-series databases",
      "Telemetry pipelines",
    ],
    projects: [
      "Temperature and motion sensor circuit",
      "MQTT messaging flow for constrained devices",
      "Firmware sampling and alert logic",
      "Capstone: Connected monitoring solution with cloud telemetry dashboard",
    ],
    skills: [
      "Sensor circuits",
      "Microcontroller programming",
      "MQTT messaging",
      "Firmware logic",
      "Telemetry pipelines",
      "Cloud dashboards",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build sensor circuits for temperature, motion, and environmental data",
      "Design MQTT and HTTP messaging flows for constrained devices",
      "Develop firmware logic for sampling, sleep modes, and alerts",
      "Deploy device telemetry to cloud dashboards and databases",
      "Integrate edge gateways, brokers, and device shadows",
      "Evaluate power, connectivity, and reliability trade-offs",
      "Secure devices with authentication, encryption, and updates",
      "Automate device provisioning, testing, and data validation",
    ],
    curriculum: [
      "Module 01 — Foundations: IoT architecture, sensors, and actuators",
      "Module 02 — Core: microcontrollers, GPIO, and embedded programming",
      "Module 03 — Core: wireless protocols, Wi-Fi, Bluetooth, and LoRa basics",
      "Module 04 — Engineering: MQTT brokers, topics, and message design",
      "Module 05 — Engineering: edge gateways, filtering, and local rules",
      "Module 06 — Advanced: telemetry pipelines, storage, and dashboards",
      "Module 07 — Production: device management, updates, and security operations",
      "Module 08 — Capstone: deploy an end-to-end connected monitoring system",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Students and engineers with basic Python and electronics curiosity; no prior embedded experience required. Comfort with computers and spreadsheets is enough. Device work is structured as HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a sensor data logger, an MQTT-based alert system with dashboard, and a capstone connected monitoring solution with gateway, cloud pipeline, and visualization.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as IoT engineer, embedded systems technician, device integration specialist, telemetry analyst, automation technician, field systems engineer, and IoT support engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "IoT Engineering | HIGAET Academy",
      description:
        "Design IoT sensing, MQTT messaging, edge gateways, and telemetry pipelines while deploying connected device solutions through HIGAET Academy training.",
      keywords: [
        "iot engineering",
        "sensors",
        "mqtt",
        "microcontrollers",
        "telemetry pipelines",
        "edge gateways",
        "device management",
        "connected devices",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_edge_computing_engineering",
    slug: "edge-computing-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_emerging_tech",
    title: "HIGAET Edge Computing Engineering",
    summary:
      "Architect edge clusters, container workloads, stream processing, and device fleets while delivering low-latency intelligent systems through HIGAET Practical Training applied labs.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Cloud engineers",
      "DevOps practitioners",
      "Platform engineers",
      "Software developers",
      "IT administrators",
      "Engineering managers",
    ],
    prerequisites: [
      "Comfortable with Linux and containers",
      "Familiarity with Python and APIs",
      "Basic networking concepts",
    ],
    technologies: [
      "Docker",
      "Edge clusters",
      "Kubernetes",
      "Stream processing",
      "MQTT",
      "Device fleet managers",
      "Container registries",
      "Monitoring dashboards",
    ],
    projects: [
      "Containerized workload for edge hardware",
      "Edge cluster topology for latency and resilience",
      "Sensor and video stream processing job",
      "Capstone: Low-latency edge system with managed device fleet",
    ],
    skills: [
      "Edge cluster design",
      "Containerized workloads",
      "Stream processing",
      "Device fleet management",
      "Latency optimization",
      "Edge deployment",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build containerized workloads optimized for edge hardware",
      "Design edge cluster topologies for latency and resilience",
      "Develop stream processing jobs for sensor and video data",
      "Deploy models and services to edge nodes and gateways",
      "Integrate message buses, time-series stores, and cloud sync",
      "Evaluate latency, bandwidth, and offline-operation trade-offs",
      "Secure edge nodes, APIs, and over-the-air updates",
      "Optimize resource usage, caching, and inference scheduling",
    ],
    curriculum: [
      "Module 01 — Foundations: edge paradigms, latency, and use cases",
      "Module 02 — Core: Linux systems, networking, and edge hardware",
      "Module 03 — Core: containers, registries, and lightweight orchestration",
      "Module 04 — Engineering: stream ingestion, filtering, and time-series storage",
      "Module 05 — Engineering: on-device inference and model serving",
      "Module 06 — Advanced: fleet management, updates, and observability",
      "Module 07 — Advanced: zero-trust security, encryption, and access control",
      "Module 08 — Production: reliability, failover, and cloud-edge synchronization",
      "Module 09 — Capstone: architect and deploy a production-grade edge computing solution",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Cloud, DevOps, or IoT practitioners with Linux, containers, and Python fundamentals. Networking basics are recommended. All builds are delivered as HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a containerized edge data pipeline, an on-device inference service, and a capstone distributed edge deployment with monitoring, updates, and cloud synchronization.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as edge computing engineer, DevOps engineer, infrastructure engineer, IoT platform engineer, systems engineer, network engineer, and edge AI engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Edge Computing Engineering | HIGAET Academy",
      description:
        "Architect applied edge infrastructure, container orchestration, stream processing, and device fleets for low-latency intelligent systems at HIGAET Academy.",
      keywords: [
        "edge computing",
        "container orchestration",
        "stream processing",
        "edge ai",
        "fleet management",
        "time-series data",
        "distributed systems",
        "infrastructure engineer",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_digital_twin_engineering",
    slug: "digital-twin-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_emerging_tech",
    title: "HIGAET Digital Twin Engineering",
    summary:
      "Model digital twins, sensor fusion, 3D simulation, and predictive analytics while creating virtual replicas of assets through HIGAET Practical Training applied engineering projects.",
    duration: "8 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "Software developers",
      "Data engineers",
      "Operations staff",
      "Product managers",
      "Researchers",
      "Engineering managers",
    ],
    prerequisites: [
      "Comfortable with Python fundamentals",
      "Familiarity with APIs and JSON data",
      "Basic statistics concepts",
    ],
    technologies: [
      "3D simulation tools",
      "Sensor fusion pipelines",
      "Telemetry ingestion",
      "Visualization dashboards",
      "Geometric modeling",
      "Predictive analytics",
      "Time-series databases",
      "MQTT",
    ],
    projects: [
      "Geometric and behavioral asset model",
      "Sensor fusion pipeline for real-time updates",
      "3D simulation and visualization dashboard",
      "Capstone: Virtual asset replica with live telemetry ingestion",
    ],
    skills: [
      "Digital twin modeling",
      "Sensor fusion",
      "3D visualization",
      "Simulation dashboards",
      "Predictive analytics",
      "Telemetry ingestion",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build geometric and behavioral models of physical assets",
      "Design sensor fusion pipelines for real-time twin updates",
      "Develop 3D visualizations and simulation dashboards",
      "Deploy twin data services with live telemetry ingestion",
      "Integrate IoT platforms, historians, and analytics tools",
      "Evaluate model fidelity, latency, and prediction accuracy",
      "Secure twin data flows and access-controlled interfaces",
      "Automate calibration, validation, and anomaly detection routines",
    ],
    curriculum: [
      "Module 01 — Foundations: digital twin concepts, types, and lifecycles",
      "Module 02 — Core: sensors, data acquisition, and asset modeling",
      "Module 03 — Core: 3D geometry, scene design, and visualization",
      "Module 04 — Engineering: fusion, synchronization, and state estimation",
      "Module 05 — Engineering: simulation logic, rules, and what-if analysis",
      "Module 06 — Advanced: predictive models, thresholds, and maintenance signals",
      "Module 07 — Production: deployment, governance, and lifecycle management",
      "Module 08 — Capstone: deliver an operational digital twin with live data and analytics",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Engineers and analysts with Python, data handling, and basic 3D or systems thinking. IoT familiarity is helpful. Modeling work is completed as HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build an asset data model, a live 3D monitoring dashboard, and a capstone operational digital twin with sensor integration, simulation, and predictive alerts.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as digital twin engineer, simulation engineer, industrial data analyst, IoT solutions engineer, predictive maintenance analyst, systems modeler, and manufacturing technology specialist.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Digital Twin Engineering | HIGAET Academy",
      description:
        "Model digital twins, sensor fusion, 3D simulation, and predictive analytics for factories, buildings, and infrastructure with HIGAET Academy.",
      keywords: [
        "digital twins",
        "sensor fusion",
        "3d simulation",
        "predictive analytics",
        "industrial iot",
        "asset modeling",
        "simulation engineer",
        "predictive maintenance",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_robotics_engineering",
    slug: "robotics-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_emerging_tech",
    title: "HIGAET Robotics Engineering",
    summary:
      "Learn kinematics, sensing, control systems, and ROS programming while assembling and programming mobile robots through HIGAET Practical Training hands-on engineering labs.",
    duration: "12 weeks",
    level: "advanced",
    mode: "hybrid",
    audience: [
      "Software developers",
      "AI engineers",
      "Researchers",
      "Students",
      "IT administrators",
      "Entrepreneurs",
    ],
    prerequisites: [
      "No previous robotics experience required",
      "Basic Python familiarity helpful",
      "Comfortable with computers and electronics basics",
    ],
    technologies: [
      "ROS",
      "Motors and controllers",
      "Sensors",
      "Kinematic models",
      "Navigation stacks",
      "Simulation environments",
      "Control systems",
      "Path-planning libraries",
    ],
    projects: [
      "Mobile robot assembly with motors and sensors",
      "Kinematic model for manipulator motion",
      "ROS nodes for perception and navigation",
      "Capstone: Mobile robot with obstacle avoidance and path planning",
    ],
    skills: [
      "Kinematics",
      "Sensing systems",
      "Control systems",
      "ROS programming",
      "Robot navigation",
      "Path planning",
      "Obstacle avoidance",
    ],
    hoursPerWeek: "5-7 hours/week",
    outcomes: [
      "Build mobile robot assemblies with motors, sensors, and controllers",
      "Design kinematic models and motion constraints for manipulators",
      "Develop ROS nodes for perception, navigation, and control",
      "Deploy obstacle avoidance and path-planning behaviors",
      "Integrate cameras, lidar, IMU, and actuator feedback",
      "Evaluate localization accuracy, stability, and safety limits",
      "Secure control interfaces and operational stop procedures",
      "Automate calibration, testing, and performance benchmarking",
    ],
    curriculum: [
      "Module 01 — Foundations: robotics systems, mathematics, and safety",
      "Module 02 — Core: kinematics, dynamics, and coordinate frames",
      "Module 03 — Core: sensors, actuators, and embedded controllers",
      "Module 04 — Engineering: ROS architecture, topics, and packages",
      "Module 05 — Engineering: localization, mapping, and navigation stacks",
      "Module 06 — Engineering: computer vision for detection and tracking",
      "Module 07 — Advanced: manipulation, grasping, and motion planning",
      "Module 08 — Advanced: control theory, PID tuning, and simulation",
      "Module 09 — Production: testing, maintenance, and field deployment",
      "Module 10 — Capstone: build and demonstrate an autonomous mobile robotics system",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Engineering students and developers with Python, Linux basics, and introductory physics or mathematics. Prior hardware experience is helpful but optional. Lab work runs as HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a sensor-driven robot chassis, a ROS-based navigation module, and a capstone autonomous robot that maps, navigates, and completes assigned tasks.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as robotics engineer, ROS developer, automation engineer, controls engineer, mechatronics technician, perception engineer, field robotics specialist, and systems integration engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Robotics Engineering | HIGAET Academy",
      description:
        "Engineer robotic kinematics, sensing, control systems, and ROS programming while building autonomous mobile robots through HIGAET Academy labs.",
      keywords: [
        "robotics engineering",
        "ros programming",
        "kinematics",
        "control systems",
        "computer vision",
        "navigation",
        "mechatronics",
        "automation engineer",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_autonomous_systems_engineering",
    slug: "autonomous-systems-engineering",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_emerging_tech",
    title: "HIGAET Autonomous Systems Engineering",
    summary:
      "Master perception, localization, planning, and control stacks while engineering safe autonomous vehicles and drones through HIGAET Practical Training applied simulation projects.",
    duration: "10 weeks",
    level: "advanced",
    mode: "online",
    audience: [
      "AI engineers",
      "ML engineers",
      "Software developers",
      "Researchers",
      "Engineering managers",
      "Technology leaders",
    ],
    prerequisites: [
      "Comfortable with Python and data libraries",
      "Familiarity with sensors and control basics",
      "Basic linear algebra and statistics",
    ],
    technologies: [
      "Perception pipelines",
      "Sensor fusion",
      "Localization and mapping",
      "Path-planning libraries",
      "Control systems",
      "Simulation environments",
      "Object detection models",
      "ROS",
    ],
    projects: [
      "Perception pipeline for detection and tracking",
      "Localization and mapping workflow with sensor fusion",
      "Path-planning logic for dynamic environments",
      "Capstone: Autonomous vehicle or drone stack with steering and flight control",
    ],
    skills: [
      "Perception pipelines",
      "Localization and mapping",
      "Path planning",
      "Control systems",
      "Sensor fusion",
      "Autonomous decision logic",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Build perception pipelines for detection, tracking, and segmentation",
      "Design localization and mapping workflows with sensor fusion",
      "Develop path-planning and decision logic for dynamic environments",
      "Deploy control systems for steering, braking, and flight",
      "Integrate simulation environments, datasets, and middleware",
      "Evaluate safety cases, failure modes, and operational boundaries",
      "Secure autonomy stacks against sensor spoofing and software faults",
      "Automate scenario testing, regression suites, and performance metrics",
    ],
    curriculum: [
      "Module 01 — Foundations: autonomy levels, architectures, and safety",
      "Module 02 — Core: sensors, calibration, and data synchronization",
      "Module 03 — Core: perception, detection, and tracking algorithms",
      "Module 04 — Engineering: localization, SLAM, and HD maps",
      "Module 05 — Engineering: behavior planning and trajectory generation",
      "Module 06 — Advanced: vehicle and flight control systems",
      "Module 07 — Advanced: simulation, datasets, and edge-case testing",
      "Module 08 — Production: validation, monitoring, and fleet operations",
      "Module 09 — Capstone: engineer and validate an autonomous system in simulation",
    ],
    faqs: [
      {
        question: "Who should take this course and what are the prerequisites?",
        answer:
          "Advanced learners with Python, linear algebra basics, and robotics or machine learning familiarity. Simulation experience is useful. Project work is delivered as HIGAET Practical Training / Experiential Learning.",
      },
      {
        question: "What will I build during this course?",
        answer:
          "You will build a perception and tracking pipeline, a planning and control module, and a capstone simulated autonomous vehicle or drone mission with safety evaluation.",
      },
      {
        question: "What careers does this course support?",
        answer:
          "It supports roles such as autonomous systems engineer, perception engineer, planning engineer, simulation engineer, robotics software engineer, validation engineer, and autonomy test engineer.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Autonomous Systems | HIGAET Academy",
      description:
        "Develop perception, mapping, planning, and control stacks for safe autonomous vehicles and drones through applied engineering at HIGAET Academy.",
      keywords: [
        "autonomous systems",
        "perception",
        "sensor fusion",
        "path planning",
        "slam",
        "simulation testing",
        "control systems",
        "autonomy engineer",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_engineering_management",
    slug: "engineering-management",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_engineering_leadership",
    title: "HIGAET Engineering Management",
    summary:
      "Learn to lead software teams through hiring, coaching, delivery planning, and performance systems while building operating cadences that ship reliable products.",
    duration: "8 weeks",
    level: "professional",
    mode: "online",
    audience: [
      "Engineering managers",
      "Technology leaders",
      "Software developers",
      "Backend developers",
      "Product managers",
      "Operations staff",
    ],
    prerequisites: [
      "Familiarity with software development workflows",
      "Experience working on a software team",
      "Basic understanding of agile delivery practices",
    ],
    technologies: ["Jira", "Linear", "GitHub Projects", "Confluence", "Notion", "Lattice", "Slack"],
    projects: [
      "Sprint delivery cadence plan",
      "Team structure and onboarding blueprint",
      "Delivery metrics and capacity review",
      "Coaching and performance review playbook",
      "Capstone: Engineering management operating system",
    ],
    skills: [
      "Sprint planning",
      "Team structuring",
      "Delivery metrics analysis",
      "Capacity planning",
      "Performance coaching",
      "Onboarding design",
      "Operating cadence management",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Lead sprint planning, standups, reviews, and retros that improve delivery predictability",
      "Design team structures, roles, and onboarding plans for growing engineering groups",
      "Evaluate delivery metrics, capacity, and quality signals to guide decisions",
      "Architect feedback, coaching, and performance review practices for engineers",
      "Govern technical debt, incident response, and on-call rotations responsibly",
      "Develop hiring plans, interview loops, and leveling criteria for teams",
      "Optimize cross-team communication with product, design, and stakeholders",
      "Build a team operating plan covering goals, rituals, and growth paths",
    ],
    curriculum: [
      "Module 01 — Foundations: Management transitions, team models, and leadership responsibilities",
      "Module 02 — Core: Hiring, interviewing, onboarding, and leveling engineers",
      "Module 03 — Core: Coaching, feedback, one-on-ones, and performance management",
      "Module 04 — Core: Agile delivery, estimation, capacity planning, and roadmaps",
      "Module 05 — Practice: Metrics, DORA signals, quality gates, and status reporting",
      "Module 06 — Practice: Incident management, on-call health, and technical debt governance",
      "Module 07 — Advanced: Stakeholder management, conflict resolution, and distributed teams",
      "Module 08 — Advanced: Career ladders, compensation inputs, and retention practices",
      "Module 09 — Capstone: Produce a team operating plan with hiring, rituals, metrics, and a quarterly delivery roadmap",
    ],
    faqs: [
      {
        question: "Who should take this course and what experience is expected?",
        answer:
          "Senior engineers, tech leads, and new managers moving into people leadership. Learners should have around two years of software experience and familiarity with agile delivery. No degree is required.",
      },
      {
        question: "What will I produce during the course?",
        answer:
          "You will produce a hiring scorecard, a team delivery dashboard, coaching and feedback worksheets, and a capstone team operating plan with rituals, metrics, and a quarterly roadmap.",
      },
      {
        question: "What roles does this course support?",
        answer:
          "It supports engineering manager, team lead, delivery manager, program manager, technical lead, QA lead, and release manager roles. It builds leadership readiness without promising employment.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Engineering Management | HIGAET Academy",
      description:
        "Lead engineering teams with hiring, coaching, delivery metrics, and operating cadences through HIGAET Practical Training and guided projects.",
      keywords: [
        "engineering management",
        "team leadership",
        "hiring engineers",
        "delivery metrics",
        "coaching",
        "agile delivery",
        "incident management",
        "career ladders",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_technical_product_management",
    slug: "technical-product-management",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_engineering_leadership",
    title: "HIGAET Technical Product Management",
    summary:
      "Learn to translate customer needs into technical requirements, APIs, and roadmaps while building specs, backlogs, and release plans with engineering teams.",
    duration: "8 weeks",
    level: "professional",
    mode: "online",
    audience: [
      "Product managers",
      "Software developers",
      "Engineering managers",
      "Technology leaders",
      "Backend developers",
      "Entrepreneurs",
    ],
    prerequisites: [
      "Familiarity with software development lifecycles",
      "Basic understanding of APIs and data models",
      "Comfort reading usage data and requirements",
    ],
    technologies: ["Jira", "Confluence", "Notion", "Figma", "Postman", "GitHub", "Mixpanel"],
    projects: [
      "Customer problem and scope brief",
      "Product requirements and acceptance criteria pack",
      "API contract and data model specification",
      "Prioritized backlog and release plan",
      "Capstone: Technical product roadmap and release plan",
    ],
    skills: [
      "Requirements definition",
      "User story writing",
      "API contract design",
      "Backlog prioritization",
      "Roadmap planning",
      "Release planning",
      "Scope analysis",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Evaluate customer problems, usage data, and technical constraints to shape scope",
      "Design product requirements, user stories, and acceptance criteria engineers can build",
      "Architect API contracts, data models, and integration requirements with developers",
      "Build prioritized backlogs, roadmaps, and release plans tied to outcomes",
      "Lead backlog refinement, sprint reviews, and launch readiness with stakeholders",
      "Develop instrumentation, analytics events, and experiment plans for features",
      "Optimize onboarding, activation, and usability through iterative releases",
      "Govern scope changes, dependencies, and risk across product increments",
    ],
    curriculum: [
      "Module 01 — Foundations: Technical product roles, discovery, and delivery lifecycles",
      "Module 02 — Core: User research synthesis, problem framing, and opportunity mapping",
      "Module 03 — Core: Requirements writing, user stories, acceptance criteria, and edge cases",
      "Module 04 — Core: APIs, data models, integrations, and non-functional requirements",
      "Module 05 — Practice: Backlog management, prioritization frameworks, and roadmap planning",
      "Module 06 — Practice: Prototyping, usability testing, and analytics instrumentation",
      "Module 07 — Advanced: Experimentation, A/B testing, rollout strategies, and launch plans",
      "Module 08 — Advanced: Stakeholder alignment, pricing inputs, and support readiness",
      "Module 09 — Capstone: Produce a product requirements package with roadmap, backlog, and launch checklist as HIGAET Practical Training",
    ],
    faqs: [
      {
        question: "Who should take this course and what experience is expected?",
        answer:
          "Engineers, analysts, designers, and associate product managers seeking technical product roles. Learners should be comfortable with software concepts and basic data literacy. No degree is required.",
      },
      {
        question: "What will I produce during the course?",
        answer:
          "You will produce a product requirements document, an API and data specification, a prioritized roadmap, and a capstone launch package with backlog and release checklist.",
      },
      {
        question: "What roles does this course support?",
        answer:
          "It supports technical product manager, product owner, business analyst, solutions consultant, API product manager, platform product manager, and program manager roles.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Technical Product Mgmt | HIGAET Academy",
      description:
        "Build technical specs, API requirements, roadmaps, and launch plans for software products through HIGAET Practical Training and reviews.",
      keywords: [
        "technical product management",
        "requirements",
        "user stories",
        "api products",
        "roadmaps",
        "backlog management",
        "experimentation",
        "product analytics",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },

  {
    id: "academy_course_technology_architecture",
    slug: "technology-architecture",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_engineering_leadership",
    title: "HIGAET Technology Architecture",
    summary:
      "Learn to design enterprise technology landscapes, platforms, and standards while building reference architectures, migration plans, and governance models.",
    duration: "8 weeks",
    level: "professional",
    mode: "online",
    audience: [
      "Technology leaders",
      "Engineering managers",
      "Cloud engineers",
      "Platform engineers",
      "Backend developers",
      "IT administrators",
    ],
    prerequisites: [
      "Experience building or operating software systems",
      "Familiarity with cloud services and platforms",
      "Understanding of application, data, and infrastructure layers",
    ],
    technologies: ["AWS", "Azure", "Kubernetes", "Terraform", "Kafka", "PostgreSQL", "Confluence"],
    projects: [
      "Enterprise reference architecture",
      "Platform evaluation and fitness review",
      "Integration landscape and shared services map",
      "Architecture governance model",
      "Capstone: Technology landscape migration and governance plan",
    ],
    skills: [
      "Reference architecture design",
      "Platform evaluation",
      "Integration design",
      "Cloud service selection",
      "Standards governance",
      "Migration planning",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Architect enterprise reference architectures across applications, data, and infrastructure",
      "Evaluate platforms, frameworks, and cloud services against long-term fitness",
      "Design integration landscapes, shared services, and platform boundaries",
      "Govern architecture standards, review boards, and exception processes",
      "Develop migration and modernization plans for legacy estates",
      "Secure architectures through identity, network, and data-protection patterns",
      "Optimize for reliability, scalability, and operational cost at portfolio scale",
      "Build technology radars, principles, and decision records for organizations",
    ],
    curriculum: [
      "Module 01 — Foundations: Enterprise architecture domains, viewpoints, and stakeholder concerns",
      "Module 02 — Core: Application portfolios, domain boundaries, and platform topology",
      "Module 03 — Core: Data architecture, integration styles, and event-driven landscapes",
      "Module 04 — Core: Cloud, infrastructure, and networking patterns for enterprises",
      "Module 05 — Practice: Standards, principles, review boards, and governance workflows",
      "Module 06 — Practice: Modernization, migration sequencing, and strangler patterns",
      "Module 07 — Advanced: Security architecture, resilience, disaster recovery, and compliance mapping",
      "Module 08 — Advanced: Cost architecture, FinOps inputs, and vendor consolidation",
      "Module 09 — Capstone: Produce a technology architecture blueprint with roadmap, standards, and migration plan as HIGAET Experiential Learning",
    ],
    faqs: [
      {
        question: "Who should take this course and what experience is expected?",
        answer:
          "Senior engineers, technical leads, and architects shaping organization-wide technology. Learners should have several years of software or infrastructure experience. No degree is required.",
      },
      {
        question: "What will I produce during the course?",
        answer:
          "You will produce a reference architecture diagram set, a platform evaluation, governance worksheets, and a capstone blueprint with migration roadmap and decision records.",
      },
      {
        question: "What roles does this course support?",
        answer:
          "It supports technology architect, enterprise architect, platform architect, cloud architect, integration architect, infrastructure lead, and principal engineer roles.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Technology Architecture | HIGAET Academy",
      description:
        "Design enterprise platforms, standards, and migration roadmaps with governance and reviews through HIGAET Practical Training projects.",
      keywords: [
        "technology architecture",
        "enterprise architecture",
        "platform strategy",
        "integration landscape",
        "modernization",
        "architecture governance",
        "cloud strategy",
        "reference architecture",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_solution_architecture",
    slug: "solution-architecture",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_engineering_leadership",
    title: "HIGAET Solution Architecture",
    summary:
      "Learn to turn business requirements into secure, costed solution designs while building architecture decision records, integration blueprints, and delivery estimates.",
    duration: "10 weeks",
    level: "professional",
    mode: "online",
    audience: [
      "Technology leaders",
      "Backend developers",
      "Cloud engineers",
      "Platform engineers",
      "Engineering managers",
      "IT administrators",
    ],
    prerequisites: [
      "Experience designing or building distributed systems",
      "Familiarity with APIs, events, and integrations",
      "Understanding of security, performance, and availability concepts",
    ],
    technologies: [
      "AWS",
      "REST APIs",
      "Apache Kafka",
      "PostgreSQL",
      "Terraform",
      "OAuth 2.0",
      "Lucidchart",
    ],
    projects: [
      "End-to-end solution design",
      "Integration blueprint",
      "Non-functional requirements evaluation",
      "Architecture decision records pack",
      "Capstone: Costed solution architecture with delivery estimates",
    ],
    skills: [
      "Solution design",
      "Integration patterns",
      "Architecture decision records",
      "Non-functional requirements analysis",
      "Cost estimation",
      "Delivery estimation",
    ],
    hoursPerWeek: "6-8 hours/week",
    outcomes: [
      "Architect end-to-end solutions from discovery through deployment and operations",
      "Design integration patterns across APIs, events, files, and third-party systems",
      "Evaluate non-functional requirements for performance, security, and availability",
      "Develop architecture decision records documenting options, tradeoffs, and rationale",
      "Secure solution designs with auth, encryption, secrets, and audit controls",
      "Optimize solution costing, licensing, and cloud resource estimates",
      "Build sequence, deployment, and data-flow views for developer handoff",
      "Lead technical proposals, reviews, and stakeholder walkthroughs confidently",
    ],
    curriculum: [
      "Module 01 — Foundations: Solution architecture roles, viewpoints, and discovery techniques",
      "Module 02 — Core: Requirements analysis, constraints, assumptions, and scope boundaries",
      "Module 03 — Core: Application, data, and infrastructure design for single solutions",
      "Module 04 — Core: Integration patterns, API design, messaging, and error handling",
      "Module 05 — Practice: Non-functional requirements, capacity planning, and resilience design",
      "Module 06 — Practice: Security design, threat modeling, and compliance alignment",
      "Module 07 — Practice: Costing, estimation, vendor inputs, and proposal writing",
      "Module 08 — Advanced: Architecture decision records, review preparation, and stakeholder sign-off",
      "Module 09 — Advanced: Handoff packages, build sequencing, test strategy, and cutover planning",
      "Module 10 — Capstone: Produce a solution architecture dossier with diagrams, decision records, costing, and delivery plan",
    ],
    faqs: [
      {
        question: "Who should take this course and what experience is expected?",
        answer:
          "Developers, consultants, and technical leads designing client or internal solutions. Learners should have hands-on software or cloud experience and basic modeling skills. No degree is required.",
      },
      {
        question: "What will I produce during the course?",
        answer:
          "You will produce discovery notes, integration blueprints, a decision-record set, and a capstone solution dossier with costing, security design, and delivery sequencing.",
      },
      {
        question: "What roles does this course support?",
        answer:
          "It supports solution architect, pre-sales engineer, integration architect, application architect, cloud consultant, systems analyst, and delivery lead roles.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Solution Architecture | HIGAET Academy",
      description:
        "Design secure, costed solutions with ADRs, integrations, and NFRs through HIGAET Practical Training and capstone dossier.",
      keywords: [
        "solution architecture",
        "integration patterns",
        "architecture decision records",
        "non-functional requirements",
        "solution costing",
        "threat modeling",
        "api design",
        "delivery planning",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_technical_leadership",
    slug: "technical-leadership",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_engineering_leadership",
    title: "HIGAET Technical Leadership",
    summary:
      "Learn to guide engineering direction through code stewardship, design reviews, and mentorship while building standards, review habits, and influence without authority.",
    duration: "6 weeks",
    level: "professional",
    mode: "online",
    audience: [
      "Software developers",
      "Backend developers",
      "Engineering managers",
      "Technology leaders",
      "Frontend developers",
      "Platform engineers",
    ],
    prerequisites: [
      "Professional experience writing and reviewing code",
      "Familiarity with design reviews and RFC processes",
      "Basic mentoring or pairing experience helpful",
    ],
    technologies: ["GitHub", "GitLab", "Confluence", "Notion", "SonarQube", "Jest", "Slack"],
    projects: [
      "Design and code review playbook",
      "Technical standards guide",
      "Mentorship and knowledge-sharing plan",
      "Technical tradeoff and risk memo",
      "Capstone: Technical leadership standards and review system",
    ],
    skills: [
      "Code review",
      "Design review facilitation",
      "Technical standards design",
      "Mentorship planning",
      "Tradeoff analysis",
      "Risk communication",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Lead design reviews, code reviews, and RFC processes that raise quality",
      "Architect pragmatic technical standards for testing, style, and documentation",
      "Develop mentorship plans, pairing routines, and knowledge-sharing sessions",
      "Evaluate technical tradeoffs and communicate risks to non-technical partners",
      "Build influence through writing, demos, and clear technical storytelling",
      "Optimize delivery flow by removing bottlenecks and clarifying ownership",
      "Secure team practices through secure-coding guidance and review checklists",
      "Govern technical debt with visible backlogs and repayment agreements",
    ],
    curriculum: [
      "Module 01 — Foundations: Tech-lead roles, ownership, and influence without authority",
      "Module 02 — Core: Code stewardship, review culture, and quality standards",
      "Module 03 — Core: Design docs, RFCs, decision facilitation, and tradeoff communication",
      "Module 04 — Practice: Mentorship, pairing, onboarding buddies, and learning circles",
      "Module 05 — Practice: Delivery unblocking, incident leadership, and debt governance",
      "Module 06 — Advanced: Technical storytelling, stakeholder updates, and visibility practices",
      "Module 07 — Advanced: Scaling practices across squads, guilds, and communities of practice",
      "Module 08 — Capstone: Produce a technical leadership playbook with standards, review templates, and a mentorship plan",
    ],
    faqs: [
      {
        question: "Who should take this course and what experience is expected?",
        answer:
          "Mid-level and senior engineers stepping into tech-lead responsibilities. Learners should have production coding experience and comfort giving feedback. No degree is required.",
      },
      {
        question: "What will I produce during the course?",
        answer:
          "You will produce a design-review template, a code-quality checklist, mentorship worksheets, and a capstone leadership playbook for your team context.",
      },
      {
        question: "What roles does this course support?",
        answer:
          "It supports tech lead, senior software engineer, staff engineer, squad lead, backend lead, frontend lead, and developer advocate roles.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Technical Leadership | HIGAET Academy",
      description:
        "Grow as a tech lead with reviews, RFCs, mentorship, and standards through HIGAET Practical Training and playbooks.",
      keywords: [
        "technical leadership",
        "tech lead",
        "code reviews",
        "design docs",
        "mentorship",
        "engineering standards",
        "rfc process",
        "team influence",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
  {
    id: "academy_course_engineering_strategy",
    slug: "engineering-strategy",
    status: "published",
    visibility: "public",
    categoryId: "academy_category_engineering_leadership",
    title: "HIGAET Engineering Strategy",
    summary:
      "Learn to connect engineering investment to business outcomes through portfolio planning, platform leverage, and talent strategy while building measurable operating plans.",
    duration: "6 weeks",
    level: "professional",
    mode: "online",
    audience: [
      "Engineering managers",
      "Technology leaders",
      "Product managers",
      "Operations staff",
      "Entrepreneurs",
      "Platform engineers",
    ],
    prerequisites: [
      "Experience leading or coordinating engineering work",
      "Familiarity with product and platform planning",
      "Understanding of hiring and team development basics",
    ],
    technologies: [
      "Notion",
      "Confluence",
      "Jira Align",
      "Linear",
      "GitHub Insights",
      "Tableau",
      "Miro",
    ],
    projects: [
      "Engineering strategy narrative memo",
      "Portfolio investment review",
      "Platform leverage and developer experience plan",
      "Talent system and succession plan",
      "Capstone: Measurable engineering operating plan",
    ],
    skills: [
      "Strategy narrative development",
      "Portfolio planning",
      "Platform leverage analysis",
      "Developer experience design",
      "Talent planning",
      "Operating plan design",
      "Outcome measurement",
    ],
    hoursPerWeek: "8-10 hours/week",
    outcomes: [
      "Architect engineering strategy narratives linking technology bets to business goals",
      "Evaluate portfolio investments across products, platforms, and maintenance work",
      "Design platform-leverage plans for reuse, developer experience, and speed",
      "Develop talent systems covering hiring, leveling, mobility, and succession",
      "Govern funding, prioritization, and quarterly planning across organizations",
      "Optimize engineering metrics, scorecards, and review cadences for accountability",
      "Lead build-partner-buy decisions and ecosystem strategy with vendors",
      "Build multi-quarter operating plans with milestones, risks, and owners",
    ],
    curriculum: [
      "Module 01 — Foundations: Strategy frames, business linkage, and engineering value stories",
      "Module 02 — Core: Portfolio planning, capacity allocation, and investment thesis writing",
      "Module 03 — Core: Platform strategy, developer experience, and reuse economics",
      "Module 04 — Practice: Talent strategy, org design, leveling, and succession planning",
      "Module 05 — Practice: Metrics systems, scorecards, and quarterly business reviews",
      "Module 06 — Advanced: Ecosystem decisions, sourcing, partnerships, and risk management",
      "Module 07 — Advanced: Change leadership, communication plans, and adoption measurement",
      "Module 08 — Capstone: Produce an engineering strategy and operating plan with portfolio, metrics, and talent roadmap",
    ],
    faqs: [
      {
        question: "Who should take this course and what experience is expected?",
        answer:
          "Engineering managers, directors, architects, and senior leads shaping multi-team direction. Learners should have team leadership or architecture experience. No degree is required.",
      },
      {
        question: "What will I produce during the course?",
        answer:
          "You will produce a portfolio investment map, a platform-leverage brief, an engineering scorecard, and a capstone strategy with operating plan and talent roadmap.",
      },
      {
        question: "What roles does this course support?",
        answer:
          "It supports director of engineering, head of engineering, principal engineer, engineering manager, portfolio manager, platform lead, and CTO-track roles.",
      },
      {
        question: "What is the course fee?",
        answer:
          "The course fee is currently to be configured. Speak with a HIGAET advisor for the latest fee structure, cohort schedules, and available learning formats.",
      },
    ],
    metadata: {
      title: "Engineering Strategy | HIGAET Academy",
      description:
        "Set engineering strategy with portfolios, platforms, talent systems, and scorecards through HIGAET Practical Training work.",
      keywords: [
        "engineering strategy",
        "portfolio planning",
        "platform strategy",
        "talent systems",
        "engineering metrics",
        "operating plans",
        "org design",
        "technology investment",
        "higaet academy",
      ],
    },
    audit: { createdAt: CREATED_AT, updatedAt: UPDATED_AT, version: ENTRY_VERSION, author: AUTHOR },
  },
] as const;

/**
 * Frozen list of all course IDs in the Academy registry.
 * Derived from `ACADEMY_COURSES`; exported for cross-registry
 * reference validation (e.g. learning path `courseIds`).
 */
export const ACADEMY_COURSE_IDS: readonly string[] = ACADEMY_COURSES.map((c) => c.id);
