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
  "/education": ["enterprise_client", "admin", "super_admin"],
  "/dashboard/technologies": ["tech_client", "admin", "super_admin"],
  "/ops": ["ops", "admin", "super_admin"],
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
 * Use inside a route's `beforeLoad`. Behavior:
 *  - Unauthenticated → redirect to `/auth/login?redirect=<location>`.
 *  - Authenticated but unauthorized → redirect to `/403` with `from` + `required`.
 *  - `admin` / `super_admin` always bypass.
 */
export async function requireRolesOrRedirect(
  required: AppRole[],
  opts?: { location?: { href: string; pathname: string } },
): Promise<AppRole[]> {
  const here = opts?.location?.href ?? opts?.location?.pathname ?? "/dashboard";
  let roles: AppRole[];
  try {
    roles = await getMyRoles();
  } catch (e: any) {
    if (e?.isRedirect) throw e;
    throw redirect({ to: "/auth/login", search: { redirect: here } as any });
  }
  const allowed = Array.from(new Set([...required, "admin" as AppRole, "super_admin" as AppRole]));
  if (!hasAnyRole(roles, allowed)) {
    throw redirect({
      to: "/403",
      search: { from: here, required: required.join(",") } as any,
    });
  }
  return roles;
}
