import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEnvReadinessSummary } from "@/lib/env-readiness.functions";

/**
 * Compact banner rendered on the Launch Readiness page. Turns the overall
 * cutoff into Blocked when required env secrets or formats fail, regardless
 * of the CI run status.
 */
export function EnvReadinessBanner() {
  const fetchSummary = useServerFn(getEnvReadinessSummary);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "env-readiness", "summary"],
    queryFn: () => fetchSummary(),
    refetchOnWindowFocus: false,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) return null;

  const config =
    data.overall === "blocked"
      ? {
          Icon: XCircle,
          title: "Deployment BLOCKED — environment misconfigured",
          className: "border-rose-500/40 bg-rose-500/10 text-rose-800",
          badge: "destructive" as const,
        }
      : data.overall === "degraded"
      ? {
          Icon: AlertTriangle,
          title: "Environment degraded — non-blocking secrets missing",
          className: "border-amber-500/40 bg-amber-500/10 text-amber-800",
          badge: "secondary" as const,
        }
      : {
          Icon: CheckCircle2,
          title: "Environment secrets ready",
          className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800",
          badge: "secondary" as const,
        };

  return (
    <Card className={`ring-1 ring-inset ${config.className}`}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <config.Icon className="size-5" />
          <div>
            <p className="text-sm font-semibold">{config.title}</p>
            <p className="text-xs opacity-80">
              {data.blockingMissing > 0
                ? `${data.blockingMissing} blocking · `
                : ""}
              {data.missing} missing · {data.malformed} malformed
              {data.cachedAt ? ` · checked ${new Date(data.cachedAt).toLocaleString()}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.badge}>{data.overall.toUpperCase()}</Badge>
          <Link
            to="/dashboard/admin/env-readiness"
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-background/50"
          >
            <ShieldAlert className="size-3" /> Open env readiness
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
