import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyCareerProfile, updateCareerProfile } from "@/lib/career.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SkillsInput } from "@/components/career/SkillsInput";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/career/profile")({
  component: ProfilePage,
});

const empty = (k: string) => (k === "education" ? { school: "", degree: "", field: "", start: "", end: "" } : { company: "", title: "", start: "", end: "", summary: "" });

function ProfilePage() {
  const get = useServerFn(getMyCareerProfile);
  const upd = useServerFn(updateCareerProfile);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my-career-profile"], queryFn: () => get() });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (q.data && !form) {
      const d: any = q.data;
      setForm({
        full_name: d.full_name ?? "",
        headline: d.headline ?? "",
        bio: d.bio ?? "",
        location: d.location ?? "",
        phone: d.phone ?? "",
        github_url: d.github_url ?? "",
        linkedin_url: d.linkedin_url ?? "",
        website_url: d.website_url ?? "",
        skills: d.skills ?? [],
        career_goals: d.career_goals ?? "",
        education: d.education ?? [],
        experience: d.experience ?? [],
      });
    }
  }, [q.data, form]);

  const m = useMutation({
    mutationFn: (input: any) => upd({ data: input }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-career-profile"] });
      qc.invalidateQueries({ queryKey: ["my-resume"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const updateItem = (k: "education" | "experience", i: number, patch: any) =>
    setForm((f: any) => ({ ...f, [k]: f[k].map((it: any, idx: number) => (idx === i ? { ...it, ...patch } : it)) }));
  const addItem = (k: "education" | "experience") => setForm((f: any) => ({ ...f, [k]: [...f[k], empty(k)] }));
  const removeItem = (k: "education" | "experience", i: number) => setForm((f: any) => ({ ...f, [k]: f[k].filter((_: any, idx: number) => idx !== i) }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate(form);
      }}
      className="space-y-8"
    >
      <Section title="Identity">
        <Row>
          <Field label="Full name"><Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} /></Field>
          <Field label="Headline"><Input value={form.headline} onChange={(e) => update("headline", e.target.value)} placeholder="AI Engineer · HIGAET Graduate" /></Field>
        </Row>
        <Row>
          <Field label="Location"><Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Bengaluru, IN" /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></Field>
        </Row>
        <Field label="Bio">
          <Textarea rows={4} value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="A short summary recruiters will see first." />
        </Field>
      </Section>

      <Section title="Social & links">
        <Row>
          <Field label="LinkedIn"><Input value={form.linkedin_url} onChange={(e) => update("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
          <Field label="GitHub"><Input value={form.github_url} onChange={(e) => update("github_url", e.target.value)} placeholder="https://github.com/…" /></Field>
        </Row>
        <Field label="Website / portfolio"><Input value={form.website_url} onChange={(e) => update("website_url", e.target.value)} placeholder="https://…" /></Field>
      </Section>

      <Section title="Skills">
        <SkillsInput value={form.skills} onChange={(v) => update("skills", v)} />
      </Section>

      <Section title="Education" right={<AddBtn onClick={() => addItem("education")} />}>
        {form.education.length === 0 && <p className="text-xs text-muted-foreground">No entries yet.</p>}
        <div className="space-y-3">
          {form.education.map((e: any, i: number) => (
            <ItemCard key={i} onRemove={() => removeItem("education", i)}>
              <Row><Field label="School"><Input value={e.school} onChange={(ev) => updateItem("education", i, { school: ev.target.value })} /></Field>
                <Field label="Degree"><Input value={e.degree} onChange={(ev) => updateItem("education", i, { degree: ev.target.value })} /></Field></Row>
              <Row><Field label="Field"><Input value={e.field} onChange={(ev) => updateItem("education", i, { field: ev.target.value })} /></Field>
                <Field label="Start"><Input value={e.start} onChange={(ev) => updateItem("education", i, { start: ev.target.value })} placeholder="2022" /></Field>
                <Field label="End"><Input value={e.end} onChange={(ev) => updateItem("education", i, { end: ev.target.value })} placeholder="2026 / Present" /></Field></Row>
            </ItemCard>
          ))}
        </div>
      </Section>

      <Section title="Experience" right={<AddBtn onClick={() => addItem("experience")} />}>
        {form.experience.length === 0 && <p className="text-xs text-muted-foreground">No entries yet.</p>}
        <div className="space-y-3">
          {form.experience.map((e: any, i: number) => (
            <ItemCard key={i} onRemove={() => removeItem("experience", i)}>
              <Row><Field label="Company"><Input value={e.company} onChange={(ev) => updateItem("experience", i, { company: ev.target.value })} /></Field>
                <Field label="Title"><Input value={e.title} onChange={(ev) => updateItem("experience", i, { title: ev.target.value })} /></Field></Row>
              <Row><Field label="Start"><Input value={e.start} onChange={(ev) => updateItem("experience", i, { start: ev.target.value })} placeholder="Jan 2024" /></Field>
                <Field label="End"><Input value={e.end} onChange={(ev) => updateItem("experience", i, { end: ev.target.value })} placeholder="Present" /></Field></Row>
              <Field label="Summary"><Textarea rows={3} value={e.summary} onChange={(ev) => updateItem("experience", i, { summary: ev.target.value })} /></Field>
            </ItemCard>
          ))}
        </div>
      </Section>

      <Section title="Career goals">
        <Textarea rows={3} value={form.career_goals} onChange={(e) => update("career_goals", e.target.value)} placeholder="What roles and impact are you looking for?" />
      </Section>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-3">
        <Button type="submit" disabled={m.isPending} className="bg-academy text-academy-foreground hover:bg-academy/90">
          {m.isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card ring-1 ring-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
function Row({ children }: any) { return <div className="grid sm:grid-cols-2 gap-3">{children}</div>; }
function Field({ label, children }: any) { return <div><Label className="text-xs">{label}</Label><div className="mt-1.5">{children}</div></div>; }
function AddBtn({ onClick }: any) { return <Button type="button" size="sm" variant="outline" onClick={onClick}><Plus className="size-3.5" /> Add</Button>; }
function ItemCard({ children, onRemove }: any) {
  return (
    <div className="rounded-lg ring-1 ring-border p-4 space-y-3 relative">
      <button type="button" onClick={onRemove} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
      {children}
    </div>
  );
}
