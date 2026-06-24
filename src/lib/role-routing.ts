import type { AppRole } from "@/lib/auth.functions";

/**
 * Maps an app_role to the dashboard path the user should land on after login.
 * Roles without a dedicated dashboard are mapped to the closest existing one.
 * (No enum changes; no new routes — see auth-implementation report.)
 */
export const ROLE_DASHBOARD: Record<AppRole, string> = {
  super_admin: "/dashboard/admin",
  admin: "/dashboard/admin",
  ops: "/ops/reliability",
  counselor: "/dashboard/counselor",
  mentor: "/dashboard/counselor",
  faculty: "/dashboard/faculty",
  placement_officer: "/dashboard/career",
  enterprise_client: "/dashboard/education",
  tech_client: "/dashboard/technologies",
  student: "/dashboard",
};

// Priority order: highest-privilege role wins when a user has multiple.
const ROLE_PRIORITY: AppRole[] = [
  "super_admin",
  "admin",
  "ops",
  "faculty",
  "counselor",
  "mentor",
  "placement_officer",
  "enterprise_client",
  "tech_client",
  "student",
];

export function dashboardForRoles(roles: AppRole[] | null | undefined): string {
  if (!roles || roles.length === 0) return "/dashboard";
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return ROLE_DASHBOARD[r];
  }
  return "/dashboard";
}

/** Safe redirect target: only allow same-origin relative paths. */
export function safeRedirectPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}
