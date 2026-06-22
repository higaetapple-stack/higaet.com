import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listWebhookSubscriptions,
  createWebhookSubscription,
  updateWebhookSubscription,
  deleteWebhookSubscription,
  listWebhookDeliveries,
  redeliverWebhook,
  dispatchNow,
  WEBHOOK_EVENT_CATALOG,
} from "@/lib/webhooks.functions";
import { listApiKeys } from "@/lib/api-keys.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks — Admin" }] }),
  component: WebhooksAdmin,
});

function WebhooksAdmin() {
  const qc = useQueryClient();
  const listSubs = useServerFn(listWebhookSubscriptions);
  const listDeliv = useServerFn(listWebhookDeliveries);
  const listKeys = useServerFn(listApiKeys);
  const createSub = useServerFn(createWebhookSubscription);
  const updateSub = useServerFn(updateWebhookSubscription);
  const delSub = useServerFn(deleteWebhookSubscription);
  const redeliver = useServerFn(redeliverWebhook);
  const dispatchFn = useServerFn(dispatchNow);

  const subs = useQuery({ queryKey: ["webhook-subs"], queryFn: () => listSubs() });
  const deliv = useQuery({ queryKey: ["webhook-deliveries"], queryFn: () => listDeliv({ data: {} }) });
  const keys = useQuery({ queryKey: ["api-keys"], queryFn: () => listKeys() });

  const [url, setUrl] = useState("");
  const [apiKeyId, setApiKeyId] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const createM = useMutation({
    mutationFn: () => createSub({ data: { api_key_id: apiKeyId, url, event_types: events } }),
    onSuccess: (res: any) => {
      setNewSecret(res.signing_secret);
      setUrl(""); setEvents([]);
      qc.invalidateQueries({ queryKey: ["webhook-subs"] });
      toast.success("Subscription created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: (vars: { id: string; status: "active" | "paused" | "disabled" }) =>
      updateSub({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-subs"] }),
  });

  const delM = useMutation({
    mutationFn: (id: string) => delSub({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-subs"] }),
  });

  const redelM = useMutation({
    mutationFn: (id: number) => redeliver({ data: { id } }),
    onSuccess: () => { toast.success("Re-queued"); qc.invalidateQueries({ queryKey: ["webhook-deliveries"] }); },
  });

  const dispatchM = useMutation({
    mutationFn: () => dispatchFn(),
    onSuccess: (r: any) => {
      toast.success(`Dispatched: ${r.delivered}✓ ${r.failed}↻ ${r.dead}✗`);
      qc.invalidateQueries({ queryKey: ["webhook-deliveries"] });
    },
  });

  const stats = deliv.data;
  const successRate = stats && stats.total_24h > 0
    ? Math.round((stats.success_24h / stats.total_24h) * 100)
    : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Webhooks</h1>
          <p className="text-sm text-muted-foreground">Outbound event delivery to partner endpoints.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/admin/api" className="text-sm underline">API keys</Link>
          <Button size="sm" variant="outline" onClick={() => dispatchM.mutate()} disabled={dispatchM.isPending}>
            Run dispatcher now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Subscriptions" value={subs.data?.length ?? 0} />
        <Stat label="Deliveries (24h)" value={stats?.total_24h ?? 0} />
        <Stat label="Success rate" value={successRate === null ? "—" : `${successRate}%`} />
        <Stat label="Dead-letter (24h)" value={stats?.dead_24h ?? 0} />
      </div>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">New subscription</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>API key</Label>
            <Select value={apiKeyId} onValueChange={setApiKeyId}>
              <SelectTrigger><SelectValue placeholder="Select API key" /></SelectTrigger>
              <SelectContent>
                {(keys.data ?? []).filter((k: any) => k.status === "active").map((k: any) => (
                  <SelectItem key={k.id} value={k.id}>{k.name} ({k.key_prefix}…)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>HTTPS URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://partner.example.com/hooks/higaet" />
          </div>
        </div>
        <div>
          <Label>Events</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {WEBHOOK_EVENT_CATALOG.map((evt) => (
              <label key={evt} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={events.includes(evt)}
                  onCheckedChange={(v) =>
                    setEvents((prev) => v ? [...prev, evt] : prev.filter((e) => e !== evt))
                  }
                />
                <code>{evt}</code>
              </label>
            ))}
          </div>
        </div>
        <Button
          onClick={() => createM.mutate()}
          disabled={!apiKeyId || !url || events.length === 0 || createM.isPending}
        >
          Create subscription
        </Button>
        {newSecret && (
          <div className="rounded border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <div className="font-medium mb-1">Signing secret (shown once)</div>
            <code className="break-all">{newSecret}</code>
            <Button size="sm" variant="ghost" className="ml-2" onClick={() => { navigator.clipboard.writeText(newSecret); toast.success("Copied"); }}>Copy</Button>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Subscriptions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2">URL</th><th>Partner</th><th>Events</th><th>Status</th><th>Last success</th><th></th></tr>
            </thead>
            <tbody>
              {(subs.data ?? []).map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2 truncate max-w-[280px]"><code>{s.url}</code></td>
                  <td>{s.partner_name ?? s.api_key_name ?? "—"}</td>
                  <td className="text-xs">{(s.event_types ?? []).join(", ")}</td>
                  <td>
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                  </td>
                  <td className="text-xs">{s.last_success_at ? new Date(s.last_success_at).toLocaleString() : "—"}</td>
                  <td className="text-right space-x-2">
                    {s.status === "active" ? (
                      <Button size="sm" variant="ghost" onClick={() => updateM.mutate({ id: s.id, status: "paused" })}>Pause</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => updateM.mutate({ id: s.id, status: "active" })}>Resume</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete subscription?")) delM.mutate(s.id); }}>Delete</Button>
                  </td>
                </tr>
              ))}
              {(subs.data ?? []).length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No subscriptions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Recent deliveries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2">When</th><th>Event</th><th>Status</th><th>Attempt</th><th>HTTP</th><th>Error</th><th></th></tr>
            </thead>
            <tbody>
              {(stats?.deliveries ?? []).map((d: any) => (
                <tr key={d.id} className="border-t">
                  <td className="py-2 text-xs">{new Date(d.created_at).toLocaleString()}</td>
                  <td className="text-xs"><code>{d.event_type}</code></td>
                  <td>
                    <Badge variant={d.status === "success" ? "default" : d.status === "dead" ? "destructive" : "secondary"}>
                      {d.status}
                    </Badge>
                  </td>
                  <td className="text-xs">{d.attempt}/{d.max_attempts}</td>
                  <td className="text-xs">{d.response_status ?? "—"}</td>
                  <td className="text-xs truncate max-w-[260px]">{d.error ?? "—"}</td>
                  <td className="text-right">
                    {(d.status === "failed" || d.status === "dead") && (
                      <Button size="sm" variant="ghost" onClick={() => redelM.mutate(d.id)}>Replay</Button>
                    )}
                  </td>
                </tr>
              ))}
              {(stats?.deliveries ?? []).length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No deliveries.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}
