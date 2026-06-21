import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity } from "lucide-react";
import { listMySecurityEvents, type SecurityEventRow } from "@/lib/security.functions";

const SEVERITY_COLOR: Record<string, string> = {
  info: "text-muted-foreground",
  warning: "text-amber-600",
  critical: "text-destructive",
};

export function SecurityActivity() {
  const fn = useServerFn(listMySecurityEvents);
  const { data: events } = useSuspenseQuery<SecurityEventRow[]>({
    queryKey: ["security-events"],
    queryFn: () => fn({ data: { limit: 50 } }) as Promise<SecurityEventRow[]>,
  });

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display font-semibold text-base text-ink flex items-center gap-2 mb-3">
        <Activity className="size-4" /> Security activity
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No security events yet.</p>
      ) : (
        <ul className="divide-y divide-border -mx-2">
          {events.map((e) => (
            <li key={e.id} className="px-2 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-sm font-medium ${SEVERITY_COLOR[e.severity] ?? "text-ink"}`}>
                  {e.event_type.replace(/[._]/g, " ")}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {e.ip_address ?? "—"} · {e.user_agent?.slice(0, 60) ?? ""}
                </p>
              </div>
              <time className="text-[11px] text-muted-foreground shrink-0">
                {new Date(e.created_at).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
