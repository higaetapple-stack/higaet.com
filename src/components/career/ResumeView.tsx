import { Github, Linkedin, Globe, Mail, Phone, MapPin } from "lucide-react";

type Resume = {
  profile: any;
  certificates: any[];
  projects: any[];
  enrollments: any[];
};

export function ResumeView({ data, template = "classic" }: { data: Resume; template?: "classic" | "modern" }) {
  const p = data.profile;
  const accent = template === "modern" ? "border-l-4 border-academy pl-4" : "border-b border-border pb-2";
  return (
    <div className="bg-white text-zinc-900 p-10 max-w-[860px] mx-auto print:p-0 print:max-w-none font-sans" id="resume-print">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{p?.full_name ?? "Your Name"}</h1>
        {p?.headline && <p className="text-base text-zinc-600 mt-1">{p.headline}</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
          {p?.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" />{p.email}</span>}
          {p?.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{p.phone}</span>}
          {p?.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{p.location}</span>}
          {p?.linkedin_url && <span className="inline-flex items-center gap-1"><Linkedin className="size-3" />{p.linkedin_url}</span>}
          {p?.github_url && <span className="inline-flex items-center gap-1"><Github className="size-3" />{p.github_url}</span>}
          {p?.website_url && <span className="inline-flex items-center gap-1"><Globe className="size-3" />{p.website_url}</span>}
        </div>
      </header>

      {p?.bio && (
        <section className="mb-5">
          <h2 className={`text-sm uppercase tracking-wider font-semibold mb-2 ${accent}`}>Summary</h2>
          <p className="text-sm leading-relaxed">{p.bio}</p>
        </section>
      )}

      {p?.skills?.length ? (
        <section className="mb-5">
          <h2 className={`text-sm uppercase tracking-wider font-semibold mb-2 ${accent}`}>Skills</h2>
          <p className="text-sm">{p.skills.join(" · ")}</p>
        </section>
      ) : null}

      {data.certificates.length > 0 && (
        <section className="mb-5">
          <h2 className={`text-sm uppercase tracking-wider font-semibold mb-2 ${accent}`}>HIGAET Certifications</h2>
          <ul className="space-y-1.5 text-sm">
            {data.certificates.map((c: any) => (
              <li key={c.id} className="flex justify-between gap-4">
                <span><strong>{c.programs?.title}</strong> <span className="text-zinc-500">— Cert No. {c.certificate_number}</span></span>
                <span className="text-zinc-500">{new Date(c.issued_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="mb-5">
          <h2 className={`text-sm uppercase tracking-wider font-semibold mb-2 ${accent}`}>Projects</h2>
          <ul className="space-y-3 text-sm">
            {data.projects.map((pr: any) => (
              <li key={pr.id}>
                <div className="font-medium">{pr.projects?.title} <span className="text-zinc-500 font-normal">— {pr.projects?.programs?.title}</span></div>
                {pr.summary && <p className="text-zinc-700 mt-0.5">{pr.summary}</p>}
                <div className="text-xs text-zinc-500 mt-0.5">
                  {pr.repo_url && <span className="mr-3">Repo: {pr.repo_url}</span>}
                  {pr.demo_url && <span>Demo: {pr.demo_url}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {Array.isArray(p?.experience) && p.experience.length > 0 && (
        <section className="mb-5">
          <h2 className={`text-sm uppercase tracking-wider font-semibold mb-2 ${accent}`}>Experience</h2>
          <ul className="space-y-3 text-sm">
            {p.experience.map((e: any, i: number) => (
              <li key={i}>
                <div className="flex justify-between gap-4">
                  <div><strong>{e.title}</strong> — {e.company}</div>
                  <div className="text-zinc-500 text-xs">{e.start}{e.end ? ` – ${e.end}` : ""}</div>
                </div>
                {e.summary && <p className="text-zinc-700 mt-0.5">{e.summary}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {Array.isArray(p?.education) && p.education.length > 0 && (
        <section className="mb-5">
          <h2 className={`text-sm uppercase tracking-wider font-semibold mb-2 ${accent}`}>Education</h2>
          <ul className="space-y-2 text-sm">
            {p.education.map((e: any, i: number) => (
              <li key={i} className="flex justify-between gap-4">
                <div><strong>{e.school}</strong>{e.degree ? `, ${e.degree}` : ""}{e.field ? ` (${e.field})` : ""}</div>
                <div className="text-zinc-500 text-xs">{e.start}{e.end ? ` – ${e.end}` : ""}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p?.career_goals && (
        <section>
          <h2 className={`text-sm uppercase tracking-wider font-semibold mb-2 ${accent}`}>Career goals</h2>
          <p className="text-sm leading-relaxed">{p.career_goals}</p>
        </section>
      )}
    </div>
  );
}
