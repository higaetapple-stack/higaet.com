/**
 * Production Lock System (B.10) — Graph Contract Registry
 *
 * Single declarative map of every Academy-surface route and the
 * graph contracts it must satisfy. Validators in this folder consume
 * this registry only — they NEVER hardcode routes.
 */

import { PROGRAMS, CAMPUSES } from "@/lib/academy-programs";

export type RouteType = "academy" | "marketing" | "system";

export interface RouteGraphNode {
  path: string;
  type: RouteType;
  requiresBreadcrumb: boolean;
  requiresIntelligence: boolean;
  indexable: boolean;
}

const STATIC_ACADEMY: RouteGraphNode[] = [
  "/academy",
  "/academy/programs",
  "/academy/online-courses",
  "/academy/certifications",
  "/academy/learning-paths",
  "/academy/campuses",
  "/academy/corporate-training",
  "/academy/offline-training",
  "/academy/admissions",
  "/academy/scholarship",
  "/academy/placements",
  "/academy/internships",
  "/academy/success-stories",
  "/academy/faq",
  "/academy/contact",
].map((path) => ({
  path,
  type: "academy" as const,
  requiresBreadcrumb: true,
  requiresIntelligence: true,
  indexable: true,
}));

const PROGRAM_NODES: RouteGraphNode[] = PROGRAMS.map((p) => ({
  path: `/academy/programs/${p.slug}`,
  type: "academy" as const,
  requiresBreadcrumb: true,
  requiresIntelligence: true,
  indexable: true,
}));

const CAMPUS_NODES: RouteGraphNode[] = CAMPUSES.map((c) => ({
  path: `/academy/campuses/${c.slug}`,
  type: "academy" as const,
  requiresBreadcrumb: false,
  requiresIntelligence: true,
  indexable: true,
}));

export const ROUTE_GRAPH: readonly RouteGraphNode[] = [
  ...STATIC_ACADEMY,
  ...PROGRAM_NODES,
  ...CAMPUS_NODES,
];
