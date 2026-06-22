/**
 * Host-aware tenant shell resolver (Phase 10A · item 1 & 2).
 *
 * Maps the request hostname to a logical shell (brand + nav + allowed paths)
 * so the same TanStack Start app can serve every HIGAET subdomain once DNS
 * is connected. Until then, the apex hostname falls through to `corporate`
 * and every route is allowed.
 */

export type TenantShellId =
  | "corporate"
  | "academy"
  | "hub"
  | "ai"
  | "docs"
  | "api"
  | "auth";

export interface TenantShell {
  id: TenantShellId;
  /** Short human-readable brand label. */
  brand: string;
  /** Primary path prefixes this shell is allowed to serve. */
  allowedPrefixes: string[];
  /** Default path to redirect to when the hostname is hit at "/". */
  defaultPath: string;
  /** Hostname this shell is canonically served on (for production redirects). */
  canonicalHost: string | null;
}

const APEX = "higaet.com";

export const TENANT_SHELLS: Record<TenantShellId, TenantShell> = {
  corporate: {
    id: "corporate",
    brand: "HIGAET",
    // Corporate serves the marketing surface plus shared auth/dashboard
    // until subdomains take over.
    allowedPrefixes: ["/"],
    defaultPath: "/",
    canonicalHost: `www.${APEX}`,
  },
  academy: {
    id: "academy",
    brand: "HIGAET Academy",
    allowedPrefixes: ["/academy", "/dashboard", "/auth", "/learn"],
    defaultPath: "/academy",
    canonicalHost: `academy.${APEX}`,
  },
  hub: {
    id: "hub",
    brand: "HIGAET Global Education Hub",
    allowedPrefixes: ["/global-education", "/dashboard", "/auth"],
    defaultPath: "/global-education",
    canonicalHost: `hub.${APEX}`,
  },
  ai: {
    id: "ai",
    brand: "HIGAET AI",
    allowedPrefixes: ["/ai", "/dashboard", "/auth"],
    defaultPath: "/ai",
    canonicalHost: `ai.${APEX}`,
  },
  docs: {
    id: "docs",
    brand: "HIGAET Docs",
    allowedPrefixes: ["/docs"],
    defaultPath: "/docs",
    canonicalHost: `docs.${APEX}`,
  },
  api: {
    id: "api",
    brand: "HIGAET API",
    allowedPrefixes: ["/api"],
    defaultPath: "/docs/api-reference",
    canonicalHost: `api.${APEX}`,
  },
  auth: {
    id: "auth",
    brand: "HIGAET Auth",
    allowedPrefixes: ["/auth"],
    defaultPath: "/auth",
    canonicalHost: `auth.${APEX}`,
  },
};

/** Return the current request hostname (SSR or browser), lower-cased, no port. */
export function getCurrentHost(headerHost?: string | null): string {
  const raw =
    headerHost ??
    (typeof window !== "undefined" ? window.location.host : "") ??
    "";
  return raw.toLowerCase().split(":")[0];
}

/**
 * Resolve the tenant shell for a hostname. Unknown hosts (preview URLs,
 * localhost, apex) fall back to `corporate` so every route is reachable.
 */
export function resolveTenantShell(host: string): TenantShell {
  const sub = host.split(".")[0];
  switch (sub) {
    case "academy":
      return TENANT_SHELLS.academy;
    case "hub":
      return TENANT_SHELLS.hub;
    case "ai":
      return TENANT_SHELLS.ai;
    case "docs":
      return TENANT_SHELLS.docs;
    case "api":
      return TENANT_SHELLS.api;
    case "auth":
      return TENANT_SHELLS.auth;
    default:
      return TENANT_SHELLS.corporate;
  }
}

/** True when the path is served by this shell (or shell is corporate fallback). */
export function isPathAllowedForShell(shell: TenantShell, pathname: string): boolean {
  if (shell.id === "corporate") return true;
  return shell.allowedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || p === "/",
  );
}

/**
 * Find the shell that owns a given pathname so we know where to redirect a
 * mismatched request once subdomains are live.
 */
export function shellForPath(pathname: string): TenantShell {
  const ordered: TenantShellId[] = ["docs", "api", "academy", "hub", "ai", "auth"];
  for (const id of ordered) {
    const s = TENANT_SHELLS[id];
    if (s.allowedPrefixes.some((p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/")))) {
      return s;
    }
  }
  return TENANT_SHELLS.corporate;
}

/** Hosts where we should NOT enforce cross-host redirects (previews, local). */
export function isManagedHigaetHost(host: string): boolean {
  return host.endsWith(`.${APEX}`) || host === APEX;
}
