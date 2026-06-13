import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function DashboardHeader({ fullName, email }: { fullName?: string | null; email?: string | null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      navigate({ to: "/auth/login", replace: true });
    } catch (e) {
      toast.error("Sign out failed. Please try again.");
      console.error(e);
    }
  }

  const display = fullName || email || "Account";

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 lg:px-6">
      <Link to="/" className="font-display font-semibold text-base text-ink">
        HIGAET
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden md:inline">{display}</span>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-sm text-ink hover:bg-muted px-3 py-1.5 rounded-md transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
