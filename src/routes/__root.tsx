import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ORG_JSONLD, SITE, WEBSITE_JSONLD, canonicalUrl, isPrivatePath } from "@/lib/site";
import { ANALYTICS_IDS, getConsent, identifyUser, loadTags, resetIdentity } from "@/lib/analytics";
import { CookieConsent } from "@/components/site/CookieConsent";
import { Toaster } from "@/components/ui/sonner";
import { DevErrorOverlay } from "@/components/DevErrorOverlay";
import { supabase } from "@/integrations/supabase/client";
import { ObservabilityErrorBoundary } from "@/components/observability/ErrorBoundary";
import { HostGate } from "@/components/site/HostGate";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const getCurrentPathname = createIsomorphicFn()
  .server(() => {
    try {
      const req = getRequest();
      return new URL(req.url).pathname || "/";
    } catch {
      return "/";
    }
  })
  .client(() => (typeof window !== "undefined" ? window.location.pathname : "/"));

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-medium text-ink">404</h1>
        <h2 className="mt-4 text-xl font-medium text-ink">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-ink/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-medium text-ink">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-ink/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-muted"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: () => ({ pathname: getCurrentPathname() }),
  head: ({ loaderData }) => {
    const pathname = loaderData?.pathname ?? "/";
    const isPrivate = isPrivatePath(pathname);
    const canonical = canonicalUrl(pathname);

    const meta: Array<Record<string, string>> = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: `${SITE.name} — ${SITE.tagline}` },
      { name: "description", content: SITE.description },
      { name: "author", content: SITE.longName },
      { name: "theme-color", content: "#18181b" },
      { property: "og:site_name", content: SITE.name },
      { property: "og:title", content: `${SITE.name} — ${SITE.tagline}` },
      { property: "og:description", content: SITE.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonical },
      { property: "og:image", content: `${SITE.url}/og-higaet.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: SITE.twitter },
      { name: "twitter:title", content: `${SITE.name} — ${SITE.tagline}` },
      { name: "twitter:description", content: SITE.description },
      { name: "twitter:image", content: `${SITE.url}/og-higaet.png` },
    ];
    if (ANALYTICS_IDS.gscVerification) {
      meta.push({ name: "google-site-verification", content: ANALYTICS_IDS.gscVerification });
    }
    if (isPrivate) {
      meta.push({ name: "robots", content: "noindex, nofollow, noarchive" });
      meta.push({ name: "googlebot", content: "noindex, nofollow" });
    } else {
      meta.push({ name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" });
    }

    const links: Array<Record<string, string>> = [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Inter:wght@400;500;600&display=swap",
      },
    ];
    if (!isPrivate) {
      links.push({ rel: "canonical", href: canonical });
    }

    return {
      meta,
      links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(ORG_JSONLD) },
        { type: "application/ld+json", children: JSON.stringify(WEBSITE_JSONLD) },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    if (getConsent() === "granted") loadTags();
    import("@/lib/observability/sentry-browser").then((m) => m.initSentryClient());
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ObservabilityErrorBoundary boundary="root">
        <HostGate />
        <Outlet />
      </ObservabilityErrorBoundary>
      <CookieConsent />
      <Toaster />
      <DevErrorOverlay />
    </QueryClientProvider>
  );
}
