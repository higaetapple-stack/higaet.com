/**
 * HIGAET Academy — Category Registry
 * ---------------------------------------------------------------
 * Canonical, single source of truth for Academy top-level pillars.
 *
 * Layer:        src/content/academy/categories.ts
 * Workstream:   A.2 — Step 2
 * Contract:     `CategoryEntry` (see src/content/_registry/types.ts)
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - Data only. No presentation, no JSX, no CSS, no helpers.
 *   - IDs are PERMANENT business keys — never rename or reuse.
 *   - Slugs are routing concerns and may evolve (with redirects).
 *   - Cross-registry references (courses, paths) MUST use `id`.
 *   - Every `published` entry MUST carry complete SEO metadata.
 *   - Maps cleanly to a future `academy_categories` table without
 *     changing the provider contract.
 *
 * CONSUMERS (after A.2.8 wiring):
 *   - Academy homepage sections
 *   - Mega menu / primary navigation
 *   - Breadcrumb generator
 *   - Search index generator
 *   - Sitemap generator
 *   - JSON-LD (BreadcrumbList, CollectionPage)
 *   - Future backend `academy_categories` table
 *
 * FROZEN AFTER PUBLISH:
 *   The id values below become reference keys for courses, learning
 *   paths, analytics, and future foreign keys. Treat any change to
 *   an id as a breaking change requiring a major Academy bump.
 * ---------------------------------------------------------------
 */

import type { CategoryEntry } from "@/content/_registry/types";

/* ----------------------------------------------------------------
 * Shared audit defaults
 * ---------------------------------------------------------------- */

const AUTHOR = "HIGAET" as const;
const CREATED_AT = "2026-06-14T00:00:00.000Z" as const;
const UPDATED_AT = "2026-06-14T00:00:00.000Z" as const;
const ENTRY_VERSION = "1.0.0" as const;

/* ----------------------------------------------------------------
 * Category Registry
 *
 * Order reflects the recommended navigation sequence; the `order`
 * field is the authoritative sort key for consumers.
 * ---------------------------------------------------------------- */

export const ACADEMY_CATEGORIES: readonly CategoryEntry[] = [
  {
    id: "academy_category_online_courses",
    slug: "online-courses",
    status: "published",
    visibility: "public",
    name: "Online Courses",
    tagline: "Self-paced and live cohort programs in Generative AI engineering.",
    icon: "GraduationCap",
    order: 10,
    metadata: {
      title: "Online Generative AI Courses | HIGAET Academy",
      description:
        "Industry-led online courses in Generative AI engineering, LLMs, and applied machine learning — built for working professionals worldwide.",
      keywords: [
        "generative ai courses",
        "online ai courses",
        "llm engineering course",
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
    id: "academy_category_certifications",
    slug: "certifications",
    status: "published",
    visibility: "public",
    name: "Certifications",
    tagline: "Industry-recognized credentials that validate AI engineering skills.",
    icon: "BadgeCheck",
    order: 20,
    metadata: {
      title: "AI Engineering Certifications | HIGAET Academy",
      description:
        "Earn HIGAET-issued certifications in Generative AI engineering, prompt design, and applied LLM systems — validated by industry partners.",
      keywords: [
        "ai certification",
        "generative ai certification",
        "llm engineer certification",
        "higaet certification",
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
    id: "academy_category_bootcamps",
    slug: "bootcamps",
    status: "published",
    visibility: "public",
    name: "Bootcamps",
    tagline: "Immersive, mentor-led programs that ship career-ready AI engineers.",
    icon: "Rocket",
    order: 30,
    metadata: {
      title: "Generative AI Bootcamps | HIGAET Academy",
      description:
        "Cohort-based AI engineering bootcamps with live mentorship, real-world projects, and career support across global hiring markets.",
      keywords: ["ai bootcamp", "generative ai bootcamp", "llm bootcamp", "higaet bootcamp"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_category_executive_programs",
    slug: "executive-programs",
    status: "published",
    visibility: "public",
    name: "Executive Programs",
    tagline: "Strategy-focused AI programs for leaders and decision-makers.",
    icon: "Briefcase",
    order: 40,
    metadata: {
      title: "Executive AI Programs for Leaders | HIGAET Academy",
      description:
        "Executive education in Generative AI strategy, governance, and adoption — designed for senior leaders driving AI transformation.",
      keywords: [
        "executive ai program",
        "ai for leaders",
        "ai strategy course",
        "higaet executive program",
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
    id: "academy_category_workshops",
    slug: "workshops",
    status: "published",
    visibility: "public",
    name: "Workshops",
    tagline: "Short, hands-on sessions on specific AI engineering topics.",
    icon: "Wrench",
    order: 50,
    metadata: {
      title: "Hands-on AI Workshops | HIGAET Academy",
      description:
        "Short, practical workshops on Generative AI, prompt engineering, RAG, evals, and production LLM systems — led by HIGAET engineers.",
      keywords: [
        "ai workshop",
        "generative ai workshop",
        "prompt engineering workshop",
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
    id: "academy_category_learning_paths",
    slug: "learning-paths",
    status: "published",
    visibility: "public",
    name: "Learning Paths",
    tagline: "Curated, multi-course journeys toward a specific AI engineering role.",
    icon: "Route",
    order: 60,
    metadata: {
      title: "AI Engineering Learning Paths | HIGAET Academy",
      description:
        "Role-based learning paths that sequence HIGAET Academy courses into a coherent journey toward a target AI engineering outcome.",
      keywords: [
        "ai learning path",
        "generative ai roadmap",
        "ai career path",
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
    id: "academy_category_enterprise_training",
    slug: "enterprise-training",
    status: "published",
    visibility: "public",
    name: "Enterprise Training",
    tagline: "Custom AI upskilling programs for organizations and teams.",
    icon: "Building2",
    order: 70,
    metadata: {
      title: "Enterprise AI Training & Upskilling | HIGAET Academy",
      description:
        "Tailored Generative AI training for enterprise teams — from foundational literacy to production engineering, delivered globally.",
      keywords: [
        "enterprise ai training",
        "corporate ai training",
        "team ai upskilling",
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
  {
    id: "academy_category_ai_generative_ai",
    slug: "ai-generative-ai",
    status: "published",
    visibility: "public",
    name: "AI & Generative Intelligence",
    tagline: "Production LLM systems — agents, RAG, evals, and AI applications.",
    icon: "Brain",
    order: 80,
    metadata: {
      title: "AI & Generative Intelligence Courses | HIGAET Academy",
      description:
        "HIGAET courses in Generative AI engineering, LLM systems, AI agents, RAG, evals, and applied AI product development.",
      keywords: [
        "generative ai courses",
        "llm engineering course",
        "ai agents course",
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
    id: "academy_category_software_engineering",
    slug: "software-engineering",
    status: "published",
    visibility: "public",
    name: "Software Engineering",
    tagline: "Full-stack, backend, APIs, architecture, and distributed systems.",
    icon: "Code2",
    order: 90,
    metadata: {
      title: "Software Engineering Courses | HIGAET Academy",
      description:
        "HIGAET software engineering courses — full-stack, backend, APIs, system design, architecture, and microservices.",
      keywords: [
        "software engineering courses",
        "full stack course",
        "backend engineering course",
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
    id: "academy_category_cloud_infrastructure",
    slug: "cloud-infrastructure",
    status: "published",
    visibility: "public",
    name: "Cloud & Platform Engineering",
    tagline: "Cloud, DevOps, Kubernetes, platforms, and reliability engineering.",
    icon: "Cloud",
    order: 100,
    metadata: {
      title: "Cloud & Platform Engineering Courses | HIGAET Academy",
      description:
        "HIGAET cloud and infrastructure courses — DevOps, Kubernetes, platform engineering, SRE, and cloud architecture.",
      keywords: [
        "cloud engineering course",
        "devops course",
        "kubernetes course",
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
    id: "academy_category_data_ml",
    slug: "data-machine-learning",
    status: "published",
    visibility: "public",
    name: "Data & Machine Learning",
    tagline: "Analytics, data engineering, ML systems, and MLOps.",
    icon: "Database",
    order: 110,
    metadata: {
      title: "Data & Machine Learning Courses | HIGAET Academy",
      description:
        "HIGAET data and ML courses — analytics, data engineering, machine learning, deep learning, and MLOps.",
      keywords: [
        "data science course",
        "data engineering course",
        "machine learning course",
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
    id: "academy_category_cybersecurity",
    slug: "cybersecurity",
    status: "published",
    visibility: "public",
    name: "Cybersecurity",
    tagline: "Security engineering across apps, cloud, AI, and operations.",
    icon: "ShieldCheck",
    order: 120,
    metadata: {
      title: "Cybersecurity Courses | HIGAET Academy",
      description:
        "HIGAET cybersecurity courses — application, cloud, and AI security, SOC operations, and security architecture.",
      keywords: [
        "cybersecurity course",
        "cloud security course",
        "ai security course",
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
    id: "academy_category_emerging_tech",
    slug: "emerging-technology",
    status: "published",
    visibility: "public",
    name: "Emerging Technology",
    tagline: "Blockchain, Web3, IoT, edge, robotics, and autonomous systems.",
    icon: "Cpu",
    order: 130,
    metadata: {
      title: "Emerging Technology Courses | HIGAET Academy",
      description:
        "HIGAET emerging technology courses — blockchain, Web3, IoT, edge computing, robotics, and autonomous systems.",
      keywords: ["blockchain course", "web3 course", "iot course", "higaet academy"],
    },
    audit: {
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
      version: ENTRY_VERSION,
      author: AUTHOR,
    },
  },
  {
    id: "academy_category_engineering_leadership",
    slug: "engineering-leadership",
    status: "published",
    visibility: "public",
    name: "Engineering Leadership & Architecture",
    tagline: "Management, architecture, and strategy for technology leaders.",
    icon: "Users",
    order: 140,
    metadata: {
      title: "Engineering Leadership & Architecture Courses | HIGAET Academy",
      description:
        "HIGAET leadership courses — engineering management, technical leadership, product management, and architecture.",
      keywords: [
        "engineering management course",
        "technical leadership course",
        "solution architect course",
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
 * Frozen list of all category IDs in the Academy registry.
 * Exported as a convenience for type-narrowing and validation;
 * derived purely from `ACADEMY_CATEGORIES`.
 */
export const ACADEMY_CATEGORY_IDS: readonly string[] = ACADEMY_CATEGORIES.map((c) => c.id);
