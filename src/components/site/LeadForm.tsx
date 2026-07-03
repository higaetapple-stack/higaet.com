import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { LeadSchema, type LeadDivision, type LeadPayload } from "@/lib/schemas";
import { submitLead } from "@/lib/leads.functions";
import { studyAbroadEvents } from "@/lib/analytics-events";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LeadForm({
  division = "main",
  source = "contact",
  className,
  compact = false,
}: {
  division?: LeadDivision;
  source?: string;
  className?: string;
  compact?: boolean;
}) {
  const [submitted, setSubmitted] = useState(false);
  const submit = useServerFn(submitLead);

  const form = useForm<LeadPayload>({
    resolver: zodResolver(LeadSchema),
    defaultValues: { name: "", email: "", phone: "", message: "", division, source },
  });

  const onSubmit = async (values: LeadPayload) => {
    try {
      await submit({ data: values });
      trackEvent("lead_submit", { division, source });
      setSubmitted(true);
      form.reset({ ...values, name: "", email: "", phone: "", message: "" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Please try again or email us directly.");
    }
  };

  if (submitted) {
    return (
      <div className={cn("rounded-2xl bg-card ring-1 ring-border p-6", className)}>
        <h3 className="font-display text-lg font-medium text-ink mb-2">Thank you</h3>
        <p className="text-sm text-muted-foreground">
          We've received your enquiry. A HIGAET advisor will reach out within one business day.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("space-y-4", className)}
      aria-label="Enquiry form"
    >
      <div className={compact ? "" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} aria-invalid={!!form.formState.errors.email} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
        {form.formState.errors.phone && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.phone.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="message">How can we help?</Label>
        <Textarea id="message" rows={compact ? 3 : 5} {...form.register("message")} />
      </div>

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="inline-flex items-center gap-2 bg-ink text-surface text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink/90 transition-colors disabled:opacity-60"
      >
        {form.formState.isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
        Send enquiry
      </button>
    </form>
  );
}
