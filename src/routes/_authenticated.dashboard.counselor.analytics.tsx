import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { counselorAnalytics } from "@/lib/counselor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/analytics")({
  component: AnalyticsView,
});

function Stat({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="rounded-xl ring-1 ring-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-medium text-ink mt-1">
        {value}
        {suffix ? <span className="text-base text-muted-foreground ml-1">{suffix}</span> : null}
      </div>
    </div>
  );
}

function AnalyticsView() {
  const fn = useServerFn(counselorAnalytics);
  const q = useQuery({ queryKey: ["counselor-analytics"], queryFn: () => fn() });
  const d = q.data;

  if (q.isLoading || !d) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total applications" value={d.total_applications} />
        <Stat label="Conversion rate" value={d.conversion_rate} suffix="%" />
        <Stat label="Offer rate" value={d.offer_rate} suffix="%" />
        <Stat label="Completion rate" value={d.completion_rate} suffix="%" />
        <Stat label="Visa success" value={d.visa_success_rate} suffix="%" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl ring-1 ring-border bg-card p-4">
          <h3 className="text-sm font-medium text-ink mb-3">Applications by status</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(d.by_status).map(([s, n]) => (
              <li key={s} className="flex justify-between">
                <span className="text-muted-foreground">{s}</span>
                <span className="text-ink font-medium">{n as number}</span>
              </li>
            ))}
            {Object.keys(d.by_status).length === 0 && (
              <li className="text-muted-foreground italic">No data</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl ring-1 ring-border bg-card p-4">
          <h3 className="text-sm font-medium text-ink mb-3">Avg days in stage</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(d.avg_days_in_stage).map(([s, n]) => (
              <li key={s} className="flex justify-between">
                <span className="text-muted-foreground">{s}</span>
                <span className="text-ink font-medium">{n as number} d</span>
              </li>
            ))}
            {Object.keys(d.avg_days_in_stage).length === 0 && (
              <li className="text-muted-foreground italic">Not enough history yet</li>
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-border bg-card p-4">
        <h3 className="text-sm font-medium text-ink mb-3">Applications per counselor</h3>
        <ul className="space-y-2 text-sm">
          {Object.entries(d.by_counselor).map(([c, n]) => (
            <li key={c} className="flex justify-between">
              <span className="text-muted-foreground font-mono text-xs">{c}</span>
              <span className="text-ink font-medium">{n as number}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
