import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listApiKeys,
  listApiScopes,
  createApiKey,
  revokeApiKey,
  getApiKeyUsage,
} from "@/lib/api-keys.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/admin/api")({
  component: AdminApiPage,
});

function AdminApiPage() {
  const router = useRouter();
  const fetchKeys = useServerFn(listApiKeys);
  const fetchScopes = useServerFn(listApiScopes);
  const fetchUsage = useServerFn(getApiKeyUsage);
  const create = useServerFn(createApiKey);
  const revoke = useServerFn(revokeApiKey);

  const keysQ = useQuery({ queryKey: ["admin-api-keys"], queryFn: () => fetchKeys() });
  const scopesQ = useQuery({ queryKey: ["admin-api-scopes"], queryFn: () => fetchScopes() });
  const usageQ = useQuery({ queryKey: ["admin-api-usage"], queryFn: () => fetchUsage({ data: {} }), refetchInterval: 15000 });

  const [name, setName] = useState("");
  const [partner, setPartner] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<{ secret: string; prefix: string } | null>(null);

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          name,
          partner_name: partner || undefined,
          scopes: Array.from(picked),
        },
      }),
    onSuccess: (res) => {
      setRevealed({ secret: res.secret, prefix: res.prefix });
      setName(""); setPartner(""); setPicked(new Set());
      router.invalidate();
      keysQ.refetch();
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => keysQ.refetch(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-medium text-ink">Public API</h2>
        <p className="text-sm text-muted-foreground">Manage partner API keys, scopes, and usage.</p>
      </div>

      <Card className="p-5">
        <h3 className="font-medium mb-3">Issue new key</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme University integration" />
          </div>
          <div>
            <Label>Partner (optional)</Label>
            <Input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="Acme University" />
          </div>
        </div>
        <div className="mt-4">
          <Label>Scopes</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(scopesQ.data ?? []).map((s) => {
              const on = picked.has(s.scope);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    const next = new Set(picked);
                    on ? next.delete(s.scope) : next.add(s.scope);
                    setPicked(next);
                  }}
                  className={`text-xs px-2 py-1 rounded border ${on ? "bg-academy text-white border-academy" : "bg-background border-border text-muted-foreground"}`}
                  title={s.description ?? ""}
                >
                  {s.scope}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4">
          <Button disabled={!name || picked.size === 0 || createMut.isPending} onClick={() => createMut.mutate()}>
            {createMut.isPending ? "Creating…" : "Create key"}
          </Button>
        </div>

        {revealed && (
          <div className="mt-4 p-3 rounded border border-amber-400 bg-amber-50">
            <p className="text-sm font-medium text-amber-900">Copy this secret now — it will not be shown again.</p>
            <code className="block mt-2 text-xs break-all bg-white p-2 rounded border">{revealed.secret}</code>
            <button className="text-xs underline mt-2" onClick={() => setRevealed(null)}>Dismiss</button>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-medium mb-3">Active keys</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Prefix</th>
                <th className="py-2 pr-3">Scopes</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Last used</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(keysQ.data ?? []).map((k) => (
                <tr key={k.id} className="border-t border-border">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{k.name}</div>
                    {k.partner_name && <div className="text-xs text-muted-foreground">{k.partner_name}</div>}
                  </td>
                  <td className="py-2 pr-3"><code className="text-xs">{k.key_prefix}…</code></td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant={k.status === "active" ? "default" : "outline"}>{k.status}</Badge>
                  </td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "—"}
                  </td>
                  <td className="py-2 text-right">
                    {k.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => revokeMut.mutate(k.id)}>Revoke</Button>
                    )}
                  </td>
                </tr>
              ))}
              {!keysQ.data?.length && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No API keys yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-medium">Recent requests</h3>
          <div className="text-xs text-muted-foreground">
            24h: <strong>{usageQ.data?.total_24h ?? 0}</strong> · errors:{" "}
            <strong className={(usageQ.data?.errors_24h ?? 0) > 0 ? "text-red-600" : ""}>
              {usageQ.data?.errors_24h ?? 0}
            </strong>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-1 pr-2">Time</th>
                <th className="py-1 pr-2">Method</th>
                <th className="py-1 pr-2">Endpoint</th>
                <th className="py-1 pr-2">Status</th>
                <th className="py-1 pr-2">Latency</th>
              </tr>
            </thead>
            <tbody>
              {(usageQ.data?.recent ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-1 pr-2 text-muted-foreground">{new Date(r.created_at).toLocaleTimeString()}</td>
                  <td className="py-1 pr-2">{r.method}</td>
                  <td className="py-1 pr-2"><code>{r.endpoint}</code></td>
                  <td className={`py-1 pr-2 ${r.status_code >= 400 ? "text-red-600" : ""}`}>{r.status_code}</td>
                  <td className="py-1 pr-2">{r.latency_ms ?? "—"} ms</td>
                </tr>
              ))}
              {!usageQ.data?.recent?.length && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
