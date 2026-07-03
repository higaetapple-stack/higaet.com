import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getUniversityPublic, createMyApplication } from "@/lib/study-abroad.functions";
import { seoHead } from "@/lib/seo/seo-head";
import { universityJsonLd } from "@/lib/seo/schema";
import { breadcrumbJsonLd } from "@/components/site/Breadcrumbs";
import { studyAbroadEvents } from "@/lib/analytics-events";

export const Route = createFileRoute("/global-education/universities/$slug")({
  head: ({ params }) => {
    const path = `/global-education/universities/${params.slug}`;
    const name = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const title = `${name} — HIGAET Global Hub`;
    const description = `Programs, tuition, intakes, scholarships, and application path for ${name} via HIGAET Global Education Hub.`;
    return seoHead({
      path,
      title,
      description,
      jsonLd: [
        universityJsonLd({ path, name, description }),
        breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Global Education", href: "/global-education" },
          { label: "Universities", href: "/global-education/universities" },
          { label: name },
        ]),
      ],
    });
  },
  component: UniversityDetail,
  notFoundComponent: () => <div className="p-10">University not found.</div>,
  errorComponent: ({ error }) => <div className="p-10">Error: {error.message}</div>,
});

function UniversityDetail() {
  const { slug } = Route.useParams();
  const nav = useNavigate();
  const fetcher = useServerFn(getUniversityPublic);
  const apply = useServerFn(createMyApplication);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["public-uni", slug], queryFn: () => fetcher({ data: { slug } }) });
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState<string>("");
  const [intake, setIntake] = useState("");
  const [notes, setNotes] = useState("");

  const startApp = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        nav({ to: "/auth/login" });
        throw new Error("Sign in required");
      }
      if (!q.data?.university.id) throw new Error("University missing");
      studyAbroadEvents.applicationStarted({
        university_id: q.data.university.id,
        program_id: programId || undefined,
      });
      const result = await apply({ data: { university_id: q.data.university.id, program_id: programId || undefined, intake: intake || undefined, notes: notes || undefined } });
      return result;
    },
    onSuccess: (r: any) => {
      studyAbroadEvents.applicationSubmitted({
        application_id: r.id,
        university_id: q.data?.university.id,
        program_id: programId || undefined,
      });
      toast.success("Application started");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      setOpen(false);
      nav({ to: "/dashboard/applications/$id", params: { id: r.id } });
    },
    onError: (e: Error) => { if (e.message !== "Sign in required") toast.error(e.message); },
  });

  if (q.isLoading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!q.data) throw notFound();
  const { university: u, programs, scholarships } = q.data;

  return (
    <>
      <PageHero
        brand="global"
        eyebrow="University"
        title={u.name}
        subtitle={`${u.countries?.flag_emoji ?? ""} ${u.countries?.name ?? ""} · ${u.city ?? ""}`}
      >
        <div className="flex flex-wrap gap-3 items-center">
          <Link to="/global-education/universities" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"><ArrowLeft className="size-3" /> All universities</Link>
          <Button onClick={() => setOpen(true)} className="bg-global text-white hover:bg-global/90">Start application</Button>
          {u.website_url && <a href={u.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 ring-1 ring-border px-4 py-2 rounded-md text-sm">Official site <ExternalLink className="size-4" /></a>}
        </div>
      </PageHero>

      <Section>
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          <div>
            {u.overview && <p className="text-ink/90 leading-relaxed">{u.overview}</p>}
            {u.description && <p className="text-ink/90 leading-relaxed mt-4 whitespace-pre-line">{u.description}</p>}

            <h2 className="font-display text-2xl text-ink mt-10 mb-4">Programs</h2>
            <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
              {programs.map((p: any) => (
                <li key={p.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-ink font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{p.level} · {p.field ?? "—"} · {p.duration_months ? `${p.duration_months} mo` : ""}</div>
                  </div>
                  <div className="text-right text-xs">
                    {p.tuition_usd && <div className="text-ink">${Number(p.tuition_usd).toLocaleString()}</div>}
                  </div>
                </li>
              ))}
              {programs.length === 0 && <li className="p-6 text-sm text-muted-foreground text-center">No programs listed yet.</li>}
            </ul>

            {scholarships.length > 0 && (
              <>
                <h2 className="font-display text-2xl text-ink mt-10 mb-4">Scholarships</h2>
                <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
                  {scholarships.map((s: any) => (
                    <li key={s.id} className="p-4"><div className="text-ink font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.coverage}</div></li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <aside className="space-y-3">
            <SidebarFact label="World ranking" value={u.world_ranking ? `#${u.world_ranking}` : "—"} />
            <SidebarFact label="Avg tuition / year" value={u.avg_tuition_usd ? `$${Number(u.avg_tuition_usd).toLocaleString()}` : "—"} />
            <SidebarFact label="Intakes" value={u.intakes?.join(", ") ?? "—"} />
            {u.requirements && (
              <div className="rounded-2xl ring-1 ring-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Requirements</div>
                <p className="text-sm text-ink/90 whitespace-pre-line">{u.requirements}</p>
              </div>
            )}
          </aside>
        </div>
      </Section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply to {u.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Program (optional)</Label>
              <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="mt-1 w-full h-10 rounded-md ring-1 ring-border px-3 text-sm bg-background">
                <option value="">Decide later</option>
                {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.level})</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Preferred intake</Label><Input value={intake} onChange={(e) => setIntake(e.target.value)} placeholder="e.g. Fall 2026" /></div>
            <div><Label className="text-xs">Notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know?" /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => startApp.mutate()} disabled={startApp.isPending} className="bg-global text-white hover:bg-global/90">
              {startApp.isPending ? "Starting…" : "Start application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SidebarFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl ring-1 ring-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-ink font-medium">{value}</div>
    </div>
  );
}
