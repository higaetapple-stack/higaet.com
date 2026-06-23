import { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ordered sign-out: cancel in-flight protected queries → clear cache →
 * sign out → caller navigates. Prevents 401 storms and back-button leaks.
 * See tanstack-auth-guards "Sign-Out Hygiene".
 */
export async function signOutAndClear(queryClient: QueryClient) {
  try {
    await queryClient.cancelQueries();
  } catch {
    // ignore
  }
  queryClient.clear();
  await supabase.auth.signOut();
}
