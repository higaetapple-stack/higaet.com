import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { techClientDetail, upsertTechClient } from "@/lib/technologies.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/clients/$id")({
  component: ClientDetail,
});

const STATUSES = ["lead", "discovery", "proposal", "approved", "active", "completed", "archived"];

function ClientDetail() {
  const { id } = useParams({ from: "/_authenticated/dashboard/technologies/clients/$id" });
  const detail = useServerFn(techClientDetail);
  const update = useServerFn(upsertTechClient);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tech-client", id], queryFn: () => detail({ data: { id } }) });
  const m = useMutation({
    mutationFn: (v: any) => update({ data: { id, company: q.data!.client.company, ...v } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tech-client", id] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="text-muted-foreground">Not found.</div>;
  const c = q.data.client;

  return (
    <div className="grid lg:grid-cols-[1fr,360px] gap-6">
      <div className="ring-1 ring-border rounded-2xl bg-card p-5 space-y-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Client</div>
        <h2 className="font-display text-xl font-medium text-ink">{c.company}</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <F label="Status">
            <select
              value={c.status}
              onChange={(e) => m.mutate({ status: e.target.value })}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
          <F label="Industry">
            <input defaultValue={c.industry ?? ""} onBlur={(e) => m.mutate({ industry: e.target.value || null })}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" />
          </F>
          <F label="Contact person">
            <input defaultValue={c.contact_person ?? ""} onBlur={(e) => m.mutate({ contact_person: e.target.value || null })}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" />
          </F>
          <F label="Email">
            <input defaultValue={c.email ?? ""} onBlur={(e) => m.mutate({ email: e.target.value || null })}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" />
          </F>
          <F label="Phone">
            <input defaultValue={c.phone ?? ""} onBlur={(e) => m.mutate({ phone: e.target.value || null })}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" />
          </F>
          <F label="Website">
            <input defaultValue={c.website ?? ""} onBlur={(e) => m.mutate({ website: e.target.value || null })}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" />
          </F>
          <F label="Portal user (uuid)" wide>
            <input defaultValue={c.portal_user ?? ""} onBlur={(e) => m.mutate({ portal_user: e.target.value || null })}
              placeholder="Link a tech_client user to enable client portal"
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" />
          </F>
          <F label="Notes" wide>
            <textarea defaultValue={c.notes ?? ""} onBlur={(e) => m.mutate({ notes: e.target.value || null })}
              className="rounded ring-1 ring-border px-2 py-2 text-sm bg-background w-full min-h-[80px]" />
          </F>
        </div>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5 h-fit">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Projects</h3>
        <ul className="space-y-2">
          {q.data.projects.map((p: any) => (
            <li key={p.id} className="text-sm">
              <Link
                to="/dashboard/technologies/projects/$id"
                params={{ id: p.id }}
                className="text-academy hover:underline"
              >
                {p.name}
              </Link>
              <div className="text-xs text-muted-foreground">
                {p.status} · {p.start_date ?? "—"} → {p.end_date ?? "—"}
              </div>
            </li>
          ))}
          {q.data.projects.length === 0 && <li className="text-sm text-muted-foreground">No projects yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function F({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}
