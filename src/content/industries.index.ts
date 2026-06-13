import { INDUSTRIES } from "./industries";
import type { IndustryDetailContent } from "@/components/site/IndustryDetailPage";

export const ALL_INDUSTRIES: Record<string, IndustryDetailContent> = { ...INDUSTRIES };

export type IndustryCategory = {
  id: string;
  label: string;
  slugs: string[];
};

export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  {
    id: "finance",
    label: "Finance & banking",
    slugs: ["finance", "banking", "fintech"],
  },
  {
    id: "health",
    label: "Health & public sector",
    slugs: ["healthcare", "government"],
  },
  {
    id: "commerce",
    label: "Commerce & consumer",
    slugs: ["retail", "ecommerce", "hospitality"],
  },
  {
    id: "industrial",
    label: "Industrial & supply",
    slugs: ["manufacturing", "logistics", "real-estate"],
  },
  {
    id: "knowledge",
    label: "Knowledge & education",
    slugs: ["education"],
  },
  {
    id: "size",
    label: "By company size",
    slugs: ["startups", "sme", "enterprise"],
  },
];
