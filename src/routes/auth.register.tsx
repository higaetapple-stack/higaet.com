import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

const Schema = z
  .object({
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
  const form = useForm<Values>({ resolver: zodResolver(Schema), defaultValues: { name: "", email: "", password: "" } });

  const onSubmit = async (values: Values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: window.location.origin,
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
