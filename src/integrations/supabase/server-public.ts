/**
 * Server-side Supabase client using the PUBLISHABLE (anon) key.
 *
 * Use from server functions / server routes for genuinely public reads and
 * writes that should be governed by `TO anon` RLS policies — NOT by service
 * role privileges. This is the correct replacement for `supabaseAdmin` in
 * unauthenticated paths (lead capture, public portfolio, public job board).
 *
 * Never imports `localStorage`; safe in SSR / Worker runtimes.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function getServerPublicClient() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Server public client unavailable: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set.",
    );
  }
  cached = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-client-info": "higaet-server-public" } },
  });
  return cached;
}
