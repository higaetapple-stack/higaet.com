/**
 * HIGAET master Knowledge Graph (JSON-LD @graph).
 * Connects the parent organization to its three divisions, AI platform,
 * documentation, and entity authority pages so AI search engines
 * (ChatGPT, Perplexity, Gemini, Claude, Copilot) can resolve HIGAET
 * as a coherent entity.
 */
export const HIGAET_KNOWLEDGE_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://www.higaet.com/#organization",
      name: "Helen Institute of Gen AI Engineering & Technology",
      alternateName: "HIGAET",
      url: "https://www.higaet.com/",
      description:
        "HIGAET is a global institute spanning AI education, international university pathways, and enterprise software engineering.",
      sameAs: [
        "https://www.higaet.com/about-higaet",
        "https://www.higaet.com/about",
      ],
      department: [
        { "@id": "https://www.higaet.com/#academy" },
        { "@id": "https://www.higaet.com/#global-education-hub" },
        { "@id": "https://www.higaet.com/#technologies" },
      ],
      subOrganization: [
        { "@id": "https://www.higaet.com/#ai-platform" },
      ],
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://www.higaet.com/#academy",
      name: "HIGAET Academy",
      url: "https://www.higaet.com/higaet-academy",
      parentOrganization: { "@id": "https://www.higaet.com/#organization" },
      description:
        "Professional AI engineering education: certifications, learning paths, internships and placements.",
      offers: { "@type": "OfferCatalog", name: "AI Engineering Programs", url: "https://www.higaet.com/academy/programs" },
    },
    {
      "@type": "Organization",
      "@id": "https://www.higaet.com/#global-education-hub",
      name: "HIGAET Global Education Hub",
      url: "https://www.higaet.com/higaet-global-education-hub",
      parentOrganization: { "@id": "https://www.higaet.com/#organization" },
      description:
        "International university admissions, visa guidance and scholarship support for students studying abroad.",
    },
    {
      "@type": "Organization",
      "@id": "https://www.higaet.com/#technologies",
      name: "HIGAET Technologies",
      url: "https://www.higaet.com/higaet-technologies",
      parentOrganization: { "@id": "https://www.higaet.com/#organization" },
      description:
        "Enterprise AI solutions, custom software, cloud, data engineering and digital transformation services.",
    },
    {
      "@type": "Organization",
      "@id": "https://www.higaet.com/#ai-platform",
      name: "HIGAET AI Platform",
      url: "https://www.higaet.com/higaet-ai-platform",
      parentOrganization: { "@id": "https://www.higaet.com/#organization" },
      description:
        "RAG, agentic AI, multi-model orchestration, and observability for AI tutors, advisors and copilots across the HIGAET ecosystem.",
    },
  ],
} as const;
