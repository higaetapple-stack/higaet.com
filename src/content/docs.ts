/**
 * HIGAET documentation registry. Powers /docs landing, category pages,
 * and article pages with TechArticle / FAQPage / BreadcrumbList JSON-LD.
 *
 * Replace placeholder article bodies with verified content before launch.
 */
export type DocArticle = {
  slug: string;
  title: string;
  description: string;
  body: string; // markdown-ish plain text; rendered as paragraphs split on blank line
  faqs?: { q: string; a: string }[];
  updated: string; // ISO date
};

export type DocCategory = {
  slug: string;
  name: string;
  description: string;
  articles: DocArticle[];
};

const TODAY = "2026-06-22";

export const DOC_CATEGORIES: DocCategory[] = [
  {
    slug: "academy",
    name: "Academy Documentation",
    description: "Programs, certifications, learning paths, faculty model, and outcomes at HIGAET Academy.",
    articles: [
      {
        slug: "getting-started",
        title: "Getting started with HIGAET Academy",
        description: "How to choose a program, evaluate eligibility, and plan your first term.",
        body: "HIGAET Academy organizes AI engineering education across foundations, career tracks, advanced specializations, and executive programs.\n\nThis guide walks through choosing a program, checking eligibility, and planning your first term.",
        faqs: [
          { q: "How do I choose a program?", a: "Start from your goal — career switch, upskilling, or executive depth — then match level and duration." },
          { q: "Are scholarships available?", a: "Yes, through the HIGAET Aptitude Test (HAT)." },
        ],
        updated: TODAY,
      },
      {
        slug: "certifications",
        title: "HIGAET Academy certifications",
        description: "How certifications are awarded, verified, and recognized by industry partners.",
        body: "Certifications are issued on completion of program assessments and capstone reviews. Each certificate carries a verifiable ID and QR.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "study-abroad",
    name: "Study Abroad Documentation",
    description: "Admissions process, country guides, university selection, and visa preparation.",
    articles: [
      {
        slug: "admissions-process",
        title: "International admissions process",
        description: "End-to-end guide to shortlisting, applications, scholarships, offers, and visa support.",
        body: "The international admissions cycle typically spans 9–12 months. This document explains each stage and what students should prepare.",
        faqs: [
          { q: "When should I start?", a: "12–14 months before intended intake for most destinations." },
        ],
        updated: TODAY,
      },
      {
        slug: "university-selection",
        title: "How HIGAET shortlists universities",
        description: "The shortlisting framework: ambition, fit, and safety options across destinations.",
        body: "Shortlisting balances academic fit, budget, ranking band, program strength, and destination preferences.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "visa",
    name: "Visa Guides",
    description: "Destination-specific visa requirements, documentation, and interview preparation.",
    articles: [
      {
        slug: "usa-f1",
        title: "USA F-1 student visa guide",
        description: "Documentation, financial evidence, SEVIS, and interview preparation for the F-1 visa.",
        body: "Covers I-20 issuance, SEVIS payment, DS-160, financial documentation, and consular interview preparation.",
        updated: TODAY,
      },
      {
        slug: "uk-student",
        title: "UK Student Visa guide",
        description: "CAS, financial requirements, English language evidence, and biometrics for the UK Student Visa.",
        body: "Walks through CAS issuance, maintenance funds, English-language requirements, and the application timeline.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "ai-platform",
    name: "AI Platform Documentation",
    description: "HIGAET AI Platform reference: tutors, advisors, copilots, RAG, observability, and orchestration.",
    articles: [
      {
        slug: "overview",
        title: "HIGAET AI Platform overview",
        description: "Architecture of the HIGAET AI Platform across RAG, agents, and multi-model orchestration.",
        body: "The platform powers AI tutors, advisors, and copilots across the HIGAET ecosystem with RAG, agentic workflows, and observability.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "ai-engineering",
    name: "AI Engineering Guides",
    description: "Practitioner guides for AI engineering, generative AI, RAG, and agentic systems.",
    articles: [
      {
        slug: "rag-fundamentals",
        title: "RAG fundamentals",
        description: "What retrieval-augmented generation is, where it fits, and how to evaluate it.",
        body: "RAG augments LLM responses with retrieved context. This guide covers chunking, embeddings, retrieval strategies, and evaluation.",
        faqs: [
          { q: "When is RAG the wrong choice?", a: "When the answer requires reasoning over the full corpus, or when fine-tuning is a better fit." },
        ],
        updated: TODAY,
      },
      {
        slug: "agentic-ai",
        title: "Agentic AI guide",
        description: "Designing agentic systems with tool use, planning, memory, and safety boundaries.",
        body: "Covers tool selection, planning loops, memory design, and safety boundaries for production agents.",
        updated: TODAY,
      },
      {
        slug: "prompt-engineering",
        title: "Prompt engineering reference",
        description: "Prompt patterns, evaluation, and production prompt management.",
        body: "Reference for prompt patterns, prompt evaluation, and versioning prompts in production.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "api",
    name: "API Documentation",
    description: "HIGAET API platform: authentication, endpoints, webhooks, and rate limits.",
    articles: [
      {
        slug: "authentication",
        title: "API authentication",
        description: "How to authenticate against the HIGAET API platform using API keys and tokens.",
        body: "Authenticate with API keys via the `Authorization` header. Keys are scoped and revocable.",
        updated: TODAY,
      },
      {
        slug: "webhooks",
        title: "Webhook delivery",
        description: "Webhook signature verification, retries, and event types.",
        body: "Webhook deliveries are signed with HMAC-SHA256. Verify signatures with timing-safe comparison.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "knowledge-base",
    name: "Knowledge Base",
    description: "Short answers to common questions about HIGAET programs, services, and policies.",
    articles: [
      {
        slug: "what-is-higaet",
        title: "What is HIGAET?",
        description: "A short definition of HIGAET and its three divisions.",
        body: "HIGAET (Helen Institute of Gen AI Engineering & Technology) is a global institute operating HIGAET Academy, HIGAET Global Education Hub, and HIGAET Technologies.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "faq",
    name: "FAQ Center",
    description: "Frequently asked questions across Academy, Global Education Hub, and Technologies.",
    articles: [
      {
        slug: "general",
        title: "General FAQs",
        description: "Common questions about HIGAET as an organization.",
        body: "Common questions about HIGAET as a global institute.",
        faqs: [
          { q: "Where is HIGAET based?", a: "HIGAET operates globally with online and on-campus programs." },
          { q: "How can I contact HIGAET?", a: "Use the contact page of the relevant division — Academy, Global Education Hub, or Technologies." },
        ],
        updated: TODAY,
      },
    ],
  },
  {
    slug: "policies",
    name: "Policies",
    description: "Privacy, terms, refund, and academic integrity policies.",
    articles: [
      {
        slug: "privacy-overview",
        title: "Privacy overview",
        description: "How HIGAET collects, processes, and protects personal data.",
        body: "Summary of HIGAET's privacy posture. See the full Privacy Policy for binding terms.",
        updated: TODAY,
      },
    ],
  },
];

export function getCategory(slug: string): DocCategory | undefined {
  return DOC_CATEGORIES.find((c) => c.slug === slug);
}

export function getArticle(categorySlug: string, articleSlug: string) {
  const c = getCategory(categorySlug);
  if (!c) return undefined;
  const article = c.articles.find((a) => a.slug === articleSlug);
  if (!article) return undefined;
  return { category: c, article };
}
