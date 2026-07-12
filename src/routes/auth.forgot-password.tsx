import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
});
type Values = z.infer<typeof Schema>;

const SearchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth/forgot-password")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Reset password — HIGAET" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(Schema), defaultValues: { email: "" } });

  const onSubmit = async (values: Values) => {
    setLoading(true);
    authEvents.passwordReset("requested");
    try {
      // Preserve `next` through the password-reset round-trip so an OAuth
      // consent flow that landed here returns to the original destination.
      const nextParam = search.next
        ? `?next=${encodeURIComponent(search.next)}`
        : "";
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/reset-password${nextParam}`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send reset email";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a secure link to set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/auth/login" className="text-ink underline">
            Sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2 bg-ink text-surface text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink/90 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Send reset link
          </button>
        </form>
      )}
    </AuthCard>
  );
}
