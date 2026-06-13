import { Link } from "@tanstack/react-router";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";

export function JobCard({ job }: { job: any }) {
  const employer = job.employers;
  const salary =
    job.salary_min || job.salary_max
      ? `${job.salary_currency ?? "INR"} ${job.salary_min ?? "—"}${job.salary_max ? `–${job.salary_max}` : ""}`
      : null;
  return (
    <Link
      to="/jobs/$slug"
      params={{ slug: job.slug }}
      className="block rounded-2xl bg-card ring-1 ring-border p-5 hover:ring-academy/40 transition"
    >
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-lg bg-muted shrink-0 grid place-items-center overflow-hidden">
          {employer?.logo_url ? (
            <img src={employer.logo_url} alt={employer.name} className="size-full object-cover" />
          ) : (
            <Briefcase className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{employer?.name ?? "HIGAET partner"}</div>
          <h3 className="font-display text-base font-medium text-ink mt-0.5 truncate">{job.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {job.location ?? job.remote_type}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {String(job.employment_type).replace(/_/g, " ")}</span>
            <span className="capitalize">{job.experience_level}</span>
            {salary && <span>· {salary}</span>}
          </div>
          {job.skills?.length ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.skills.slice(0, 5).map((s: string) => (
                <span key={s} className="text-[10px] bg-muted text-ink px-1.5 py-0.5 rounded">{s}</span>
              ))}
            </div>
          ) : null}
        </div>
        <ArrowRight className="size-4 text-muted-foreground mt-1" />
      </div>
    </Link>
  );
}
