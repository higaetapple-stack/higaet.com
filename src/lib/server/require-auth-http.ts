/**
 * HTTP-route auth gate for TanStack server routes.
 *
 * `requireSupabaseAuth` is a server-function middleware; server routes need
 * their own bearer-token validator. Returns a 401 Response on failure, or
 * `null` + a validated user id on success.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuthResult =
  | { ok: true; userId: string; token: string }
  | { ok: false; response: Response };

export async function requireAuthHttp(request: Request): Promise<AuthResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return {
      ok: false,
      response: Response.json(
        { error: "server_misconfigured", message: "Supabase env missing" },
        { status: 500 },
      ),
    };
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return {
      ok: false,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  const supabase = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return {
      ok: false,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, userId: data.claims.sub, token };
}
