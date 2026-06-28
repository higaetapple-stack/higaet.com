import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getPublicJob } from "@/lib/portfolio.functions";
import { applyToJob, getJob, toggleSaveJob } from "@/lib/career.functions";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bookmark, MapPin, Clock, Briefcase, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ApplicationStatusBadge } from "@/components/career/ApplicationStatusBadge";

export const Route = createFileRoute("/jobs/$slug")({
  loader: async ({ params }) => {
    const job = await getPublicJob({ data: { slug: params.slug } });
    if (!job) throw notFound();
    return job;
  },
  head: ({ loaderData, params }) => {
    const j: any = loaderData;
    const title = j ? `${j.title} at ${j.employers?.name} | HIGAET Jobs` : "Job | HIGAET";
    const desc = j?.description?.slice(0, 160) ?? "Open role for HIGAET graduates.";
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/jobs/${params.slug}` },
      ],
      links: [` }],
      scripts: j ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: j.title,
          description: j.description,
          datePosted: j.posted_at,
          validThrough: j.closes_at ?? undefined,
          employmentType: j.employment_type,
          hiringOrganization: { "@type": "Organization", name: j.employers?.name, sameAs: j.employers?.website ?? undefined },
          jobLocation: { "@type": "Place", address: j.location ?? "" },
        }),
      }] : [],
    };
  },
  notFoundComponent: () => <SiteShell><Section><p>Job not found.</p></Section></SiteShell>,
  errorComponent: ({ error }) => <SiteShell><Section><p>{error.message}</p></Section></SiteShell>,
  component: JobDetail,
});

function JobDetail() {
  const job = Route.useLoaderData() as any;
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then((r) => setIsAuthed(!!r.data.user));
  }, []);

  return (
    <SiteShell>
      <Section>
        <Link to="/jobs" className="text-xs text-muted-foreground hover:text-ink">← All jobs</Link>
        <div className="mt-4 flex items-start gap-5">
          <div className="size-16 rounded-xl bg-muted overflow-hidden grid place-items-center shrink-0">
            {job.employers?.logo_url ? <img src={job.employers.logo_url} alt={job.employers.name} className="size-full object-cover" /> : <Briefcase className="size-6 text-muted-foreground" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-muted-foreground">{job.employers?.name}</div>
            <h1 className="font-display text-3xl font-medium text-ink mt-1">{job.title}</h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{job.location ?? job.remote_type}</span>
              <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{String(job.employment_type).replace(/_/g, " ")}</span>
              <span className="capitalize">{job.experience_level}</span>
              <span className="capitalize">{job.remote_type}</span>
              {(job.salary_min || job.salary_max) && (
                <span>· {job.salary_currency} {job.salary_min ?? "—"}{job.salary_max ? `–${job.salary_max}` : ""}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8 mt-8">
          <article className="prose prose-sm max-w-none">
            <h3>About the role</h3>
            <p className="whitespace-pre-wrap text-sm text-ink/90">{job.description}</p>
            {job.responsibilities && (<><h3>Responsibilities</h3><p className="whitespace-pre-wrap text-sm text-ink/90">{job.responsibilities}</p></>)}
            {job.requirements && (<><h3>Requirements</h3><p className="whitespace-pre-wrap text-sm text-ink/90">{job.requirements}</p></>)}
            {job.skills?.length > 0 && (
              <>
                <h3>Skills</h3>
                <div className="flex flex-wrap gap-2 not-prose">
                  {job.skills.map((s: string) => <span key={s} className="text-xs bg-academy/10 text-academy px-2 py-1 rounded">{s}</span>)}
                </div>
              </>
            )}
          </article>

          <aside className="lg:sticky lg:top-24 self-start space-y-3">
            {isAuthed ? <AuthedApplyPanel jobId={job.id} applyUrl={job.apply_url} /> : <SignInPanel slug={job.slug} />}
            {job.employers?.website && (
              <a href={job.employers.website} target="_blank" rel="noopener noreferrer" className="text-xs text-academy inline-flex items-center gap-1">
                Visit {job.employers.name} <ExternalLink className="size-3" />
              </a>
            )}
          </aside>
        </div>
      </Section>
    </SiteShell>
  );
}

function SignInPanel(_: { slug: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <p className="text-sm text-ink">Sign in to apply with your HIGAET resume.</p>
      <Button asChild className="w-full mt-3 bg-academy text-academy-foreground hover:bg-academy/90">
        <Link to="/auth/login">Sign in</Link>
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        New here? <Link to="/auth/register" className="text-academy">Create an account</Link>.
      </p>
    </div>
  );
}

function AuthedApplyPanel({ jobId, applyUrl }: { jobId: string; applyUrl?: string | null }) {
  const get = useServerFn(getJob);
  const apply = useServerFn(applyToJob);
  const save = useServerFn(toggleSaveJob);
  const qc = useQueryClient();
  const params = Route.useParams();
  const my = useQuery({ queryKey: ["job-state", params.slug], queryFn: () => get({ data: { slug: params.slug } }) });

  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const m = useMutation({
    mutationFn: () => apply({ data: { job_id: jobId, cover_letter: cover, portfolio_url: portfolio, include_resume: true } }),
    onSuccess: () => {
      toast.success("Application submitted");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["job-state", params.slug] });
      qc.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const sm = useMutation({
    mutationFn: () => save({ data: { job_id: jobId } }),
    onSuccess: (r: any) => { toast.success(r.saved ? "Saved" : "Removed from saved"); qc.invalidateQueries({ queryKey: ["job-state", params.slug] }); qc.invalidateQueries({ queryKey: ["my-saved-jobs"] }); },
  });

  const applied = (my.data as any)?.my_application;
  const saved = (my.data as any)?.saved;

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5 space-y-3">
      {applied ? (
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-academy"><CheckCircle2 className="size-4" /> Applied {new Date(applied.applied_at).toLocaleDateString()}</div>
          <div className="mt-2"><ApplicationStatusBadge status={applied.status} /></div>
          <Link to="/dashboard/career/applications" className="text-xs text-academy mt-3 inline-block">Manage in Career hub →</Link>
        </div>
      ) : (
        <>
          {applyUrl ? (
            <Button asChild className="w-full bg-academy text-academy-foreground hover:bg-academy/90">
              <a href={applyUrl} target="_blank" rel="noopener noreferrer">Apply externally <ExternalLink className="size-3.5" /></a>
            </Button>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-academy text-academy-foreground hover:bg-academy/90">Apply with HIGAET resume</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Submit application</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Cover letter (optional)</Label>
                    <Textarea rows={6} value={cover} onChange={(e) => setCover(e.target.value)} className="mt-1.5" placeholder="Why you're a great fit for this role." />
                  </div>
                  <div>
                    <Label className="text-xs">Portfolio URL (optional)</Label>
                    <Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="mt-1.5" placeholder="https://…" />
                  </div>
                  <p className="text-xs text-muted-foreground">A snapshot of your current resume (profile + certificates + projects) will be sent with this application.</p>
                </div>
                <DialogFooter>
                  <Button onClick={() => m.mutate()} disabled={m.isPending} className="bg-academy text-academy-foreground hover:bg-academy/90">
                    {m.isPending ? "Submitting…" : "Submit application"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" className="w-full" onClick={() => sm.mutate()} disabled={sm.isPending}>
            <Bookmark className={`size-4 ${saved ? "fill-academy text-academy" : ""}`} /> {saved ? "Saved" : "Save job"}
          </Button>
        </>
      )}
    </div>
  );
}
