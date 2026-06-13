import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listVisaCases } from "@/lib/visa.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/visa")({
  component: CounselorVisa,
});

const STATUSES = [
  "",
  "draft",
  "documents_pending",
  "ready_to_submit",
  "submitted",
  "interview_scheduled",
  "administrative_processing",
  "approved",
  "rejected",
];

function CounselorVisa() {
  const fn = useServerFn(listVisaCases);
  const [status, setStatus] = useState("");
  const q = useQuery({
    queryKey: ["counselor-visa", status],
    queryFn: () => fn({ data: { status: (status || undefined) as any, assigned_to_me: true } }),
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Country</th>
              <th className="p-3">Status</th>
              <th className="p-3">Interview</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {(q.data ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">
                  <div className="text-ink font-medium">{c.student?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{c.student?.email}</div>
                </td>
                <td className="p-3 text-xs">{c.countries?.flag_emoji} {c.countries?.name ?? "—"}</td>
                <td className="p-3 text-xs">{c.status}</td>
                <td className="p-3 text-xs">{c.interview_date ?? "—"}</td>
                <td className="p-3 text-right">
                  <Link
                    to="/dashboard/admin/visa/$id"
                    params={{ id: c.id }}
                    className="text-academy text-xs font-medium hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {!q.isLoading && (q.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No visa cases assigned.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
