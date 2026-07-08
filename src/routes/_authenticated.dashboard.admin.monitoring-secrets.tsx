import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Save, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  INTEGRATION_KEYS,
  listIntegrationSecrets,
  upsertIntegrationSecret,
  verifyIntegrations,
  type IntegrationKey,
  type IntegrationSecretRow,
  type IntegrationVerification,
} from "@/lib/integration-secrets.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/monitoring-secrets")({
  component: MonitoringSecretsPage,
});

function MonitoringSecretsPage() {
  const listFn = useServerFn(listIntegrationSecrets);
  const saveFn = useServerFn(upsertIntegrationSecret);
  const verifyFn = useServerFn(verifyIntegrations);
  const qc = useQueryClient();

  const listQ = useQuery<IntegrationSecretRow[]>({
    queryKey: ["admin", "integration-secrets"],
    queryFn: () => listFn({}),
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [verifyResults, setVerifyResults] = useState<IntegrationVerification[] | null>(null);

  const saveMut = useMutation({
    mutationFn: (v: { key: IntegrationKey; value: string }) => saveFn({ data: v }),
    onSuccess: (_r, v) => {
      toast({ title: "Saved", description: `${v.key} updated.` });
      setDrafts((d) => ({ ...d, [v.key]: "" }));
      qc.invalidateQueries({ queryKey: ["admin", "integration-secrets"] });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  const verifyMut = useMutation({
    mutationFn: () => verifyFn({}),
    onSuccess: (r) => {
      setVerifyResults(r);
      qc.invalidateQueries({ queryKey: ["admin", "integration-secrets"] });
      const bad = r.filter((v) => !v.ok).length;
      toast({
        title: bad === 0 ? "All providers verified" : `${bad} provider(s) failed`,
        variant: bad === 0 ? undefined : "destructive",
      });
    },
  });

  const byKey = new Map<string, IntegrationSecretRow>((listQ.data ?? []).map((r) => [r.key, r]));
  const groups = ["Sentry", "Datadog", "Uptime"] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="size-6" /> Monitoring & alerting credentials
          </h1>
          <p className="text-sm text-muted-foreground">
            Admin-only. Values are stored server-side and never returned to the browser after save; the input clears once written.
          </p>
        </div>
        <Button onClick={() => verifyMut.mutate()} disabled={verifyMut.isPending}>
          {verifyMut.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}
          Verify connectivity
        </Button>
      </div>

      {verifyResults && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Last verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {verifyResults.map((v) => (
              <div key={v.provider} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                {v.ok ? <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 text-rose-600" />}
                <div className="flex-1">
                  <div className="font-medium capitalize">{v.provider}</div>
                  <div className="text-muted-foreground">{v.detail}</div>
                  {v.proof && (
                    <a href={v.proof} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Proof <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {groups.map((group) => (
        <Card key={group}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {INTEGRATION_KEYS.filter((k) => k.group === group).map((meta) => {
              const row = byKey.get(meta.key);
              return (
                <div key={meta.key} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Label className="text-sm">{meta.label}</Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        env key <code className="font-mono">{meta.key}</code>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {row?.present ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
                          Saved · {row.masked}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700">
                          Not set
                        </Badge>
                      )}
                      {row?.last_verified_ok !== null && row?.last_verified_ok !== undefined && (
                        row.last_verified_ok ? (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700">
                            Failed
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder={meta.placeholder}
                      value={drafts[meta.key] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [meta.key]: e.target.value }))}
                      className="max-w-md flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const v = drafts[meta.key]?.trim();
                        if (!v) return;
                        saveMut.mutate({ key: meta.key, value: v });
                      }}
                      disabled={saveMut.isPending || !(drafts[meta.key]?.trim())}
                    >
                      {saveMut.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                      Save
                    </Button>
                    <a href={meta.proofHref} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">
                      docs
                    </a>
                  </div>
                  {row?.last_verified_detail && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last verify · {row.last_verified_at ? new Date(row.last_verified_at).toLocaleString() : "—"} · {row.last_verified_detail}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
