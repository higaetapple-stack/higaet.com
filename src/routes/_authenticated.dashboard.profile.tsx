import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getMyProfile, updateMyProfile } from "@/lib/auth.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
});

const Schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  headline: z.string().trim().max(200).optional().or(z.literal("")),
});
type Values = z.infer<typeof Schema>;

function ProfilePage() {
  const fetchProfile = useServerFn(getMyProfile);
  const updateProfile = useServerFn(updateMyProfile);
  const queryClient = useQueryClient();

  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { full_name: "", phone: "", headline: "" },
  });

  useEffect(() => {
    if (profile.data) {
      form.reset({
        full_name: profile.data.full_name ?? "",
        phone: profile.data.phone ?? "",
        headline: profile.data.headline ?? "",
      });
    }
  }, [profile.data, form]);

  const mutation = useMutation({
    mutationFn: (values: Values) => updateProfile({ data: values }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Update failed");
    },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-medium text-ink">My profile</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Your personal details. Email comes from your sign-in account and can't be changed here.
      </p>

      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="mt-8 space-y-5 rounded-xl bg-card ring-1 ring-border p-6"
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.data?.email ?? ""} disabled />
        </div>
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" {...form.register("full_name")} />
          {form.formState.errors.full_name && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.full_name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
        </div>
        <div>
          <Label htmlFor="headline">Headline</Label>
          <Textarea id="headline" rows={3} placeholder="One line about you (optional)" {...form.register("headline")} />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 bg-ink text-surface text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink/90 transition-colors disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </button>
      </form>
    </div>
  );
}
