import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthCard } from "./auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyRoles } from "@/lib/auth.functions";
import { dashboardForRoles, safeRedirectPath } from "@/lib/role-routing";
import { authEvents } from "@/lib/analytics-events";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
  password: z.string().min(8, "Minimum 8 characters").max(128),
});
type Values = z.infer<typeof Schema>;

const SearchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth/login")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — HIGAET" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

async function resolvePostLoginDestination(redirectParam: string | undefined): Promise<string> {
  const safe = safeRedirectPath(redirectParam);
  if (safe) return safe;
  try {
    const roles = await getMyRoles();
    return dashboardForRoles(roles);
  } catch {
    return "/dashboard";
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(Schema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (values: Values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      toast.success("Welcome back");
      const to = await resolvePostLoginDestination(search.redirect);
      navigate({ to, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  async function signInWithProvider(provider: "google" | "apple") {
    const setBusy = provider === "google" ? setGoogleLoading : setAppleLoading;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) {
        toast.error(result.error.message ?? `${provider} sign-in failed`);
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `${provider} sign-in failed`);
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Sign in to HIGAET"
      subtitle="Access your learning, admissions, or project dashboard."
      footer={
        <>
          New to HIGAET?{" "}
          <Link to="/auth/register" className="text-ink underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-2 mb-4">
        <button
          type="button"
          onClick={() => signInWithProvider("google")}
          disabled={googleLoading || appleLoading}
          className="w-full inline-flex justify-center items-center gap-2 ring-1 ring-border bg-surface text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors disabled:opacity-60"
        >
          {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => signInWithProvider("apple")}
          disabled={googleLoading || appleLoading}
          className="w-full inline-flex justify-center items-center gap-2 ring-1 ring-border bg-ink text-surface text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink/90 transition-colors disabled:opacity-60"
        >
          {appleLoading ? <Loader2 className="size-4 animate-spin" /> : <AppleMark />}
          Continue with Apple
        </button>
      </div>
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center gap-2 bg-ink text-surface text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink/90 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </button>
        <div className="text-right">
          <Link to="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-ink">
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3A12 12 0 0 1 12.7 28L6.1 33A20 20 0 0 0 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.3 5.3C41.1 35.6 44 30.3 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function AppleMark() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}
