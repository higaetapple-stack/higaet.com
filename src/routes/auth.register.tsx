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

const Schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
  password: z.string().min(8, "Minimum 8 characters").max(128),
});
type Values = z.infer<typeof Schema>;

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Create an account — HIGAET" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: Values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: { full_name: values.name },
        },
      });
      if (error) throw error;
      toast.success("Account created. Check your email to confirm.");
      navigate({ to: "/auth/login" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-up failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  async function signUpWithGoogle() {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your HIGAET account"
      subtitle="One account across Academy, Global Hub, and Technologies."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth/login" className="text-ink underline">
            Sign in
          </Link>
        </>
      }
    >
      <button
        type="button"
        onClick={signUpWithGoogle}
        disabled={googleLoading}
        className="w-full inline-flex justify-center items-center gap-2 ring-1 ring-border bg-surface text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors disabled:opacity-60 mb-4"
      >
        {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
        Sign up with Google
      </button>
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
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
          Create account
        </button>
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
