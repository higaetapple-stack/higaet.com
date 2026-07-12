import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Managed Cloud Auth OAuth 2.1 consent route.
 *
 * Supabase Auth (authorization server) redirects the user here after they
 * sign in as part of an external OAuth flow — typically an AI client
 * (ChatGPT, Claude, Cursor) connecting to HIGAET's MCP server.
 *
 * File path uses `[.]` to escape the literal dot in the URL segment; a
 * filename that starts with `.` would be treated as a hidden file and
 * silently skipped by the TanStack route generator.
 *
 * Contract:
 *   1. Require an authenticated Supabase session; otherwise send the user
 *      through `/auth` and preserve the full consent URL in `next`.
 *   2. Fetch authorization details for `authorization_id`.
 *   3. Render approve/deny UI with client name + description.
 *   4. On approve/deny, redirect to the URL the auth server returns.
 */

// Local typed wrapper: the `auth.oauth` namespace is beta and may not be
// visible to TypeScript yet. Cast the client through this interface rather
// than reaching into node_modules or fabricating raw REST calls.
type OAuthAuthorizationDetails = {
  client?: { name?: string; description?: string; redirect_uris?: string[] };
  redirect_url?: string;
  redirect_to?: string;
  scopes?: string[];
};

type OAuthAPI = {
  getAuthorizationDetails: (id: string) => Promise<{
    data: OAuthAuthorizationDetails | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
  denyAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
};

function oauth(): OAuthAPI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.auth as any).oauth as OAuthAPI;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: the Supabase client reads its session from localStorage,
  // which is absent during SSR — otherwise signed-in users would bounce to
  // /auth on hard refresh.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id:
      typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) {
      throw new Error("Missing authorization_id");
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      // Send unauthenticated users straight to /auth/login (a leaf route
      // that validates `next`) rather than the /auth layout which strips
      // unknown search params. Every auth entry point (password sign-in,
      // Google, Apple, signup email confirmation) honors `next` — see
      // src/routes/auth.login.tsx and src/routes/auth.register.tsx.
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get(
      "authorization_id",
    );
    if (!authorizationId) throw new Error("Missing authorization_id");
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      throw redirect({ href: immediate });
    }
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-semibold text-foreground">
        Could not load this authorization request
      </h1>
      <p className="mt-2 text-muted-foreground">
        {(error as Error)?.message ?? String(error)}
      </p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-semibold">Authorization not found</h1>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauth();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-semibold text-foreground">
        Connect {clientName} to HIGAET
      </h1>
      <p className="mt-3 text-muted-foreground">
        This lets {clientName} use HIGAET as you. It can call HIGAET's enabled
        tools while you are signed in. Your account permissions and data
        policies still apply.
      </p>

      {details?.client?.description ? (
        <p className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm">
          {details.client.description}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(true)}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Working…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(false)}
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground disabled:opacity-60"
        >
          Cancel connection
        </button>
      </div>
    </main>
  );
}
