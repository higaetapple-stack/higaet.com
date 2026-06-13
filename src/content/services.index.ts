import { SERVICES as CORE } from "./services";
import { SERVICES_EXTRA } from "./services.extra";
import type { ServiceDetailContent } from "@/components/site/ServiceDetailPage";

export const ALL_SERVICES: Record<string, ServiceDetailContent> = {
  ...CORE,
  ...SERVICES_EXTRA,
};

/**
 * Curated service categories — used by the in-page service navigation
 * component and the footer to give every service page a discoverable map of
 * the wider HIGAET Technologies offer.
 */
export type ServiceCategory = {
  id: string;
  label: string;
  slugs: string[];
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "build",
    label: "Build & engineer",
    slugs: [
      "custom-software-development",
      "enterprise-software",
      "web-development",
      "mobile-development",
      "product-development",
      "saas-products",
      "api-development",
    ],
  },
  {
    id: "design",
    label: "Design & experience",
    slugs: ["ui-ux-design"],
  },
  {
    id: "ai-data",
    label: "AI & data",
    slugs: ["ai-solutions", "data-engineering", "business-intelligence"],
  },
  {
    id: "cloud-ops",
    label: "Cloud & operations",
    slugs: ["cloud-solutions", "cloud-migration", "devops", "qa-testing", "software-maintenance"],
  },
  {
    id: "modernize",
    label: "Modernize & integrate",
    slugs: ["legacy-modernization", "system-integration", "digital-transformation"],
  },
  {
    id: "teams",
    label: "Teams & advisory",
    slugs: ["dedicated-team", "staff-augmentation", "it-consulting"],
  },
];

export function getServiceMeta(slug: string): { label: string; href: string } | null {
  const s = ALL_SERVICES[slug];
  if (!s) return null;
  return { label: s.eyebrow, href: s.path };
}
