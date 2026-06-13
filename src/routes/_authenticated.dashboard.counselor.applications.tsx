import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { myApplications } from "@/lib/counselor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/applications")({
  component: MyApps,
});

const STATUSES = ["", "lead", "counseling", "started", "docs_submitted", "submitted", "offer", "rejected"];

function MyApps() {
  const fn = useServerFn(myApplications);
  const [status, setStatus] = useState("");
  const q = useQuery({
    queryKey: ["my-applications", status],
    queryFn: () => fn({ data: { status: status || undefined } }),
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
            <option key={s} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto ring-1 ring-border rounded-2xl bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">University</th>
              <th className="p-3">Program</th>
              <th className="p-3">Intake</th>
              <th className="p-3">Status</th>
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
            {(q.data ?? []).map((a: any) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-3">
                  <div className="text-ink font-medium">{a.profiles?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{a.profiles?.email}</div>
                </td>
                <td className="p-3 text-xs">{a.universities?.name ?? "—"}</td>
                <td className="p-3 text-xs">{a.university_programs?.title ?? "—"}</td>
                <td className="p-3 text-xs">{a.intake ?? "—"}</td>
                <td className="p-3 text-xs">{a.status}</td>
                <td className="p-3 text-right">
                  <Link
                    to="/dashboard/admin/crm/$type/$id"
                    params={{ type: "application", id: a.id }}
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
                  No applications assigned to you.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
