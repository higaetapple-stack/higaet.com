import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "./auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authEvents } from "@/lib/analytics-events";

const Schema = z
  .object({
    password: z.string().min(8, "At least 8 characters").max(128),
    confirm: z.string().min(8).max(128),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });
type Values = z.infer<typeof Schema>;

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — HIGAET" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { password: "", confirm: "" },
  });

  // Supabase parses the recovery tokens from the URL hash on load and fires a
  // PASSWORD_RECOVERY event when the temporary session is ready.
  useEffect(() => {
    let cancelled = false;
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY") setReady("ok");
    });
    // Fallback: if a session already exists (link already consumed), allow set.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setReady((prev) => (prev === "ok" ? prev : data.session ? "ok" : "invalid"));
    });
    return () => {
      cancelled = true;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (values: Values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      authEvents.passwordReset("completed");
      toast.success("Password updated. You're signed in.");
      nav({ to: "/dashboard" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <>
          Changed your mind?{" "}
          <Link to="/auth/login" className="text-ink underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {ready === "checking" && (
        <p className="text-sm text-muted-foreground">Verifying reset link…</p>
      )}
      {ready === "invalid" && (
        <div className="space-y-3 text-sm">
          <p className="text-destructive">
            This reset link is invalid or expired.
          </p>
          <Link to="/auth/forgot-password" className="text-ink underline">
            Request a new link
          </Link>
        </div>
      )}
      {ready === "ok" && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              {...form.register("confirm")}
            />
            {form.formState.errors.confirm && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.confirm.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2 bg-ink text-surface text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink/90 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Update password
          </button>
        </form>
      )}
    </AuthCard>
  );
}
