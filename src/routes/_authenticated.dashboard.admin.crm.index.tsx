import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listCrmEntries } from "@/lib/crm.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/crm/")({
  component: CrmInbox,
});

const TYPES = [
  { v: "", l: "All sources" },
  { v: "study_abroad_lead", l: "Study abroad lead" },
  { v: "tech_lead", l: "Tech lead" },
  { v: "generic_lead", l: "Academy & general lead" },
  { v: "application", l: "Study abroad application" },
  { v: "job_application", l: "Job application" },
  { v: "placement", l: "Placement" },
];

const STAGES = [
  { v: "", l: "All stages" },
  { v: "new", l: "New" },
  { v: "contacted", l: "Contacted" },
  { v: "qualified", l: "Qualified" },
  { v: "in_progress", l: "In progress" },
  { v: "converted", l: "Converted" },
  { v: "closed", l: "Closed" },
];

const STAGE_BADGE: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-800",
  qualified: "bg-purple-100 text-purple-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  converted: "bg-emerald-100 text-emerald-800",
  closed: "bg-gray-200 text-gray-700",
};

function CrmInbox() {
  const list = useServerFn(listCrmEntries);
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["crm-inbox", type, status, search],
    queryFn: () =>
      list({
        data: {
          entity_type: (type || undefined) as any,
          crm_status: (status || undefined) as any,
          search: search || undefined,
        },
      }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-medium text-ink">Unified CRM</h2>
          <p className="text-sm text-muted-foreground">
            All leads, applications, and placements across Academy, Global, and Technologies.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        >
          {TYPES.map((t) => (
            <option key={t.v} value={t.v}>
              {t.l}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        >
          {STAGES.map((s) => (
            <option key={s.v} value={s.v}>
              {s.l}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background flex-1 min-w-[200px]"
        />
      </div>

      <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Contact</th>
              <th className="p-3">Source</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Substatus</th>
              <th className="p-3">Created</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {(q.data ?? []).map((r: any) => (
              <tr key={`${r.entity_type}-${r.entity_id}`} className="border-t border-border">
                <td className="p-3">
                  <div className="text-ink font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.subtitle}</div>
                </td>
                <td className="p-3 text-xs">
                  {TYPES.find((t) => t.v === r.entity_type)?.l ?? r.entity_type}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STAGE_BADGE[r.crm_status] ?? ""}`}
                  >
                    {r.crm_status}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {r.crm_substatus ?? r.module_status ?? "—"}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="p-3 text-right">
                  <Link
                    to="/dashboard/admin/crm/$type/$id"
                    params={{ type: r.entity_type, id: r.entity_id }}
                    className="text-academy text-xs font-medium hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {!q.isLoading && (q.data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No records match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
