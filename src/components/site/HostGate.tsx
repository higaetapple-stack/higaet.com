import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  getCurrentHost,
  isManagedHigaetHost,
  isPathAllowedForShell,
  resolveTenantShell,
  shellForPath,
} from "@/lib/tenant-shell";

/**
 * Phase 10A · item 2 — host-based route gating.
 *
 * If the current pathname doesn't belong to the resolved tenant shell, and
 * we're on a managed higaet.com host (not a preview/localhost), redirect to
 * the canonical host that owns the path. On unmanaged hosts (preview,
 * localhost, apex without DNS) this is a no-op so development stays fluid.
 */
export function HostGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = getCurrentHost();
    if (!isManagedHigaetHost(host)) return;

    const currentShell = resolveTenantShell(host);
    if (isPathAllowedForShell(currentShell, pathname)) return;

    const target = shellForPath(pathname);
    if (!target.canonicalHost || target.canonicalHost === host) return;

    window.location.replace(
      `${window.location.protocol}//${target.canonicalHost}${pathname}${window.location.search}`,
    );
  }, [pathname]);

  return null;
}
