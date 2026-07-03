import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  adminReplayIncident,
  type AdminReplayResult,
} from "@/lib/incident-replay.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RefreshCw, Rewind } from "lucide-react";
import { IncidentReplayPanel } from "@/components/admin/IncidentReplayPanel";

const replayQuery = (issueId: string) =>
  queryOptions({
    queryKey: ["admin", "incident-replay", issueId],
    queryFn: () =>
      adminReplayIncident({ data: { issueId } }) as Promise<AdminReplayResult>,
    staleTime: 60_000,
  });

export const Route = createFileRoute(
  "/_authenticated/dashboard/admin/incident-replay/$issueId",
)({
  head: () => ({
    meta: [
      { title: "AI SRE — Incident Replay" },
      {
        name: "description",
        content: "Step-by-step reconstruction of an incident and the AI SRE reasoning over time.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(replayQuery(params.issueId)),
  component: IncidentReplayPage,
  errorComponent: ({ error }) => (
    <div className="p-6">
      <Card className="p-5 border-destructive/40">
        <h1 className="font-semibold text-destructive mb-2">Could not load replay</h1>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </Card>
    </div>
  ),
});

function IncidentReplayPage() {
  const { issueId } = Route.useParams();
  const { data } = useSuspenseQuery(replayQuery(issueId));
  const qc = useQueryClient();
  const refetch = useServerFn(adminReplayIncident);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const fresh = await refetch({ data: { issueId } });
      qc.setQueryData(["admin", "incident-replay", issueId], fresh);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/dashboard/admin/sentry"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="size-3" /> Back to Sentry intelligence
          </Link>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Rewind className="size-5" /> Incident Replay
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Forensic view — how the AI SRE reasoning evolved as events arrived. Advisory only.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`size-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {!data.configured && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">Sentry not configured</div>
            <p className="text-muted-foreground">
              Add <code>SENTRY_AUTH_TOKEN</code> to enable live replay.
            </p>
          </div>
        </Card>
      )}

      <IncidentReplayPanel data={data.replay} />
    </div>
  );
}
