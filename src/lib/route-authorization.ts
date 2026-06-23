import { redirect } from "@tanstack/react-router";
import type { AppRole } from "@/lib/auth.functions";
import { getMyRoles } from "@/lib/auth.functions";

/**
 * Centralized route → allowed roles matrix.
 * Keys are URL path prefixes; the longest matching prefix wins.
 * super_admin and admin implicitly bypass every check.
 */
export const ROUTE_PERMISSIONS: Record<string, AppRole[]> = {
  "/dashboard/admin": ["admin", "super_admin"],
  "/dashboard/faculty": ["faculty", "admin", "super_admin"],
  "/dashboard/counselor": ["counselor", "mentor", "admin", "super_admin"],
  "/dashboard/career": ["student", "placement_officer", "admin", "super_admin"],
  "/dashboard/education": ["enterprise_client", "admin", "super_admin"],
  "/dashboard/technologies": ["tech_client", "admin", "super_admin"],
};

export function allowedRolesForPath(pathname: string): AppRole[] | null {
  let best: { len: number; roles: AppRole[] } | null = null;
  for (const [prefix, roles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      if (!best || prefix.length > best.len) best = { len: prefix.length, roles };
    }
  }
  return best?.roles ?? null;
}

export function hasAnyRole(userRoles: AppRole[], allowed: AppRole[]): boolean {
  return userRoles.some((r) => allowed.includes(r));
}

/**
 * For use inside a route's `beforeLoad`. Throws a redirect to /dashboard
 * if the user lacks any of the required roles. Always allows admin / super_admin.
 */
export async function requireRolesOrRedirect(
  required: AppRole[],
  fallback: string = "/dashboard",
): Promise<AppRole[]> {
  try {
    const roles = await getMyRoles();
    const allowed = Array.from(new Set([...required, "admin" as AppRole, "super_admin" as AppRole]));
    if (!hasAnyRole(roles, allowed)) {
      throw redirect({ to: fallback });
    }
    return roles;
  } catch (e: any) {
    if (e?.isRedirect) throw e;
    throw redirect({ to: fallback });
  }
}
