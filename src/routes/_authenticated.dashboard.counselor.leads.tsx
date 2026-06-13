import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { myLeads } from "@/lib/counselor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/leads")({
  component: MyLeads,
});

const STAGES = ["", "new", "contacted", "qualified", "in_progress", "converted", "closed"];

function MyLeads() {
  const fn = useServerFn(myLeads);
  const [stage, setStage] = useState("");
  const q = useQuery({
    queryKey: ["my-leads", stage],
    queryFn: () => fn({ data: { crm_status: stage || undefined } }),
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s || "All stages"}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Lead</th>
              <th className="p-3">Country</th>
              <th className="p-3">Intake</th>
              <th className="p-3">Stage</th>
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
            {(q.data ?? []).map((l: any) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-3">
                  <div className="text-ink font-medium">{l.full_name}</div>
                  <div className="text-xs text-muted-foreground">{l.email}</div>
                </td>
                <td className="p-3 text-xs">{l.country_of_interest ?? "—"}</td>
                <td className="p-3 text-xs">
                  {l.level_of_interest ?? "—"} {l.intake_year ?? ""}
                </td>
                <td className="p-3 text-xs">{l.crm_status}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleDateString()}
                </td>
                <td className="p-3 text-right">
                  <Link
                    to="/dashboard/admin/crm/$type/$id"
                    params={{ type: "study_abroad_lead", id: l.id }}
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
                  No leads assigned to you.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
