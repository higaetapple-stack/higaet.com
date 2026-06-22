import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMyEducationProfile, updateMyEducationProfile } from "@/lib/education-hub.functions";

export const Route = createFileRoute("/_authenticated/education/profile")({
  component: ProfilePage,
});

type Form = {
  full_name: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
  linkedin_url: string;
  website_url: string;
};

const empty: Form = {
  full_name: "",
  phone: "",
  location: "",
  headline: "",
  bio: "",
  linkedin_url: "",
  website_url: "",
};

function ProfilePage() {
  const qc = useQueryClient();
  const fetcher = useServerFn(getMyEducationProfile);
  const saver = useServerFn(updateMyEducationProfile);
  const q = useQuery({ queryKey: ["edu-profile"], queryFn: () => fetcher() });
  const [form, setForm] = useState<Form>(empty);

  useEffect(() => {
    if (q.data) {
      setForm({
        full_name: q.data.full_name ?? "",
        phone: q.data.phone ?? "",
        location: q.data.location ?? "",
        headline: q.data.headline ?? "",
        bio: q.data.bio ?? "",
        linkedin_url: q.data.linkedin_url ?? "",
        website_url: q.data.website_url ?? "",
      });
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: (data: Form) => saver({ data }),
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["edu-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="font-display text-xl text-ink">Your profile</h2>
      <p className="text-sm text-muted-foreground">
        This is how counsellors and admissions teams see you. Keep it up to date.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name">
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Location">
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </Field>
        <Field label="Headline">
          <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        </Field>
        <Field label="LinkedIn URL">
          <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
        </Field>
        <Field label="Website URL">
          <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
        </Field>
      </div>
      <Field label="About">
        <Textarea rows={5} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </Field>
      <div>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
