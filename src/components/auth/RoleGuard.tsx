import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { getMyRoles, type AppRole } from "@/lib/auth.functions";
import { hasAnyRole } from "@/lib/route-authorization";

/**
 * Inline UI authorization guards. These complement (not replace) the route-level
 * `beforeLoad` checks defined in route-authorization.ts. Use these to gate
 * buttons, panels, or page sections inside an already-authenticated shell.
 */

function Pending({ fallback }: { fallback?: ReactNode }) {
  return <>{fallback ?? null}</>;
}

export function RequireAuth({
  children,
  fallback,
  redirectTo = "/auth/login",
}: {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}) {
  const { isReady, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isReady && !isAuthenticated) navigate({ to: redirectTo });
  }, [isReady, isAuthenticated, navigate, redirectTo]);
  if (!isReady) return <Pending fallback={fallback} />;
  if (!isAuthenticated) return <Pending fallback={fallback} />;
  return <>{children}</>;
}

function useMyRoles() {
  const fetchRoles = useServerFn(getMyRoles);
  const { isReady, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState<AppRole[] | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    let active = true;
    fetchRoles()
      .then((r) => { if (active) setRoles(r); })
      .catch(() => { if (active) setRoles([]); });
    return () => { active = false; };
  }, [isReady, isAuthenticated, fetchRoles]);

  return { roles, ready: isReady && roles !== null };
}

export function RequireRole({
  role,
  children,
  fallback = null,
}: {
  role: AppRole;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <RequireAnyRole roles={[role]} fallback={fallback}>{children}</RequireAnyRole>;
}

export function RequireAnyRole({
  roles,
  children,
  fallback = null,
}: {
  roles: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { roles: mine, ready } = useMyRoles();
  if (!ready) return <>{fallback}</>;
  const allowed = Array.from(new Set([...roles, "admin" as AppRole, "super_admin" as AppRole]));
  if (!mine || !hasAnyRole(mine, allowed)) return <>{fallback}</>;
  return <>{children}</>;
}
