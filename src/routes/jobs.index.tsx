import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listPublicJobs } from "@/lib/portfolio.functions";
import { JobCard } from "@/components/career/JobCard";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "HIGAET Job Board — AI, Data & Engineering Roles" },
      { name: "description", content: "Open roles for HIGAET graduates: AI engineers, data scientists, full-stack developers, and more." },
      { property: "og:title", content: "HIGAET Job Board" },
      { property: "og:description", content: "Open roles for HIGAET graduates." },
      { property: "og:url", content: "https://higaet.com/jobs" },
    ],
  }),
  component: JobBoard,
});

function JobBoard() {
  const [q, setQ] = useState("");
  const [emp, setEmp] = useState<string>("any");
  const [remote, setRemote] = useState<string>("any");
  const [level, setLevel] = useState<string>("any");
  const fn = useServerFn(listPublicJobs);

  const filters: any = {};
  if (q) filters.q = q;
  if (emp !== "any") filters.employment_type = emp;
  if (remote !== "any") filters.remote_type = remote;
  if (level !== "any") filters.experience_level = level;

  const query = useQuery({
    queryKey: ["public-jobs", filters],
    queryFn: () => fn({ data: filters }),
  });

  return (
    <SiteShell>
      <PageHero
        eyebrow="Job Board"
        title="Roles for HIGAET graduates."
        subtitle="Curated openings from our partner network. Apply with your HIGAET resume in one click."
      />

      <Section className="!pt-0">
        <div className="rounded-2xl bg-card ring-1 ring-border p-4 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search role or keyword…" className="pl-9" />
          </div>
          <Select value={emp} onValueChange={setEmp}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Employment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All types</SelectItem>
              <SelectItem value="full_time">Full-time</SelectItem>
              <SelectItem value="part_time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
          <Select value={remote} onValueChange={setRemote}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All locations</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All levels</SelectItem>
              <SelectItem value="entry">Entry</SelectItem>
              <SelectItem value="mid">Mid</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (query.data?.length ?? 0) === 0 ? (
          <div className="rounded-2xl bg-card ring-1 ring-border p-10 text-center">
            <p className="text-sm text-muted-foreground">No openings match your filters. Try widening the search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {(query.data as any[]).map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </Section>
    </SiteShell>
  );
}
