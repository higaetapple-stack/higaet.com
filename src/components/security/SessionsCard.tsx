import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { recordSessionRevoked } from "@/lib/security.functions";

export function SessionsCard() {
  const [loading, setLoading] = useState(false);
  const recordRevoke = useServerFn(recordSessionRevoked);

  async function signOutOthers() {
    if (!confirm("Sign out of every other device and browser?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      await recordRevoke();
      toast.success("Other sessions signed out");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display font-semibold text-base text-ink flex items-center gap-2 mb-1">
        <MonitorSmartphone className="size-4" /> Active sessions
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Revoke every other device. Your current session stays signed in.
      </p>
      <button
        onClick={signOutOthers}
        disabled={loading}
        className="inline-flex items-center gap-2 ring-1 ring-border bg-surface text-ink text-sm font-medium px-3 py-2 rounded-md hover:bg-muted disabled:opacity-60"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        Sign out other sessions
      </button>
    </div>
  );
}
