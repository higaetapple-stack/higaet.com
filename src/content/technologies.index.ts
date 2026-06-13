import { TECHNOLOGIES } from "./technologies";
import type { TechDetailContent } from "@/components/site/TechnologyDetailPage";

export const ALL_TECHNOLOGIES: Record<string, TechDetailContent> = { ...TECHNOLOGIES };

export type TechCategory = {
  id: string;
  label: string;
  slugs: string[];
};

export const TECH_CATEGORIES: TechCategory[] = [
  { id: "frontend", label: "Frontend", slugs: ["react", "nextjs", "angular", "vuejs", "html5", "css3", "javascript", "typescript"] },
  { id: "backend", label: "Backend", slugs: ["nodejs", "express", "python", "java", "spring-boot", "dotnet", "php", "laravel", "go"] },
  { id: "mobile", label: "Mobile", slugs: ["react-native", "flutter", "android", "ios"] },
  { id: "database", label: "Database", slugs: ["mysql", "postgresql", "mongodb", "redis"] },
  { id: "cloud", label: "Cloud & DevOps", slugs: ["aws", "azure", "gcp", "docker", "kubernetes"] },
  { id: "ai-data", label: "AI & Data", slugs: ["openai", "generative-ai", "machine-learning", "nlp", "computer-vision", "ai-automation", "data-engineering-tech", "business-intelligence-tech"] },
];

/**
 * Shape used by TechnologyDetailPage to render complementary-technology cards
 * without circular-import gymnastics across the registry.
 */
export type TechLookup = Record<string, { slug: string; path: string; eyebrow: string; subtitle: string }>;

export const TECH_LOOKUP: TechLookup = Object.fromEntries(
  Object.values(ALL_TECHNOLOGIES).map((t) => [
    t.slug,
    { slug: t.slug, path: t.path, eyebrow: t.eyebrow, subtitle: t.subtitle },
  ]),
);
