import { Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listIdentityProviders,
  upsertIdentityProvider,
  deleteIdentityProvider,
  type IdentityProviderRow,
} from "@/lib/security.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/identity-providers")({
  head: () => ({ meta: [{ title: "Identity providers — HIGAET admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function Page() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink">Identity providers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          SAML / OIDC enterprise SSO configuration. Microsoft Entra ID is supported via SAML metadata URL.
        </p>
      </header>
      <Suspense fallback={<Loader2 className="size-4 animate-spin" />}>
        <ProvidersList />
      </Suspense>
    </div>
  );
}

function ProvidersList() {
  const list = useServerFn(listIdentityProviders);
  const upsert = useServerFn(upsertIdentityProvider);
  const del = useServerFn(deleteIdentityProvider);
  const { data, refetch } = useSuspenseQuery({ queryKey: ["identity-providers"], queryFn: () => list() });
  const [editing, setEditing] = useState<IdentityProviderRow | null>(null);
  const [creating, setCreating] = useState(false);

  async function remove(id: string) {
    if (!confirm("Delete this provider?")) return;
    await del({ data: { id } });
    toast.success("Deleted");
    refetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 text-sm bg-ink text-surface px-3 py-2 rounded-md hover:bg-ink/90">
          <Plus className="size-4" /> New provider
        </button>
      </div>
      <ul className="space-y-2">
        {data.map((p) => (
          <li key={p.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{p.display_name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.protocol.toUpperCase()} · {p.slug} · {p.enabled ? "enabled" : "disabled"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Domains: {p.domains.length ? p.domains.join(", ") : "—"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Metadata: {p.metadata_url ?? "(scaffolded, add metadata URL to activate)"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditing(p)} className="text-xs text-academy hover:underline">Edit</button>
                <button onClick={() => remove(p.id)} className="text-destructive" aria-label="Delete"><Trash2 className="size-4" /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {(editing || creating) && (
        <ProviderForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSubmit={async (vals) => {
            await upsert({ data: vals });
            toast.success("Saved");
            setEditing(null); setCreating(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ProviderForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: IdentityProviderRow | null;
  onClose: () => void;
  onSubmit: (v: {
    id?: string;
    slug: string;
    display_name: string;
    protocol: "saml" | "oidc";
    enabled: boolean;
    metadata_url?: string | null;
    domains: string[];
  }) => Promise<void>;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.display_name ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [metaUrl, setMetaUrl] = useState(initial?.metadata_url ?? "");
  const [domains, setDomains] = useState((initial?.domains ?? []).join(", "));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await onSubmit({
        id: initial?.id,
        slug: slug.toLowerCase().trim(),
        display_name: name.trim(),
        protocol: "saml",
        enabled,
        metadata_url: metaUrl.trim() || null,
        domains: domains.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg p-6 max-w-md w-full space-y-3">
        <h3 className="font-display font-semibold text-ink">{initial ? "Edit provider" : "New provider"}</h3>
        <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="entra-higaet" /></div>
        <div><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Microsoft Entra ID" /></div>
        <div><Label>SAML metadata URL</Label><Input value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} placeholder="https://login.microsoftonline.com/.../federationmetadata.xml" /></div>
        <div><Label>Email domains (comma-separated)</Label><Input value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="higaet.com, acme.com" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enabled</label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm px-3 py-2">Cancel</button>
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 bg-ink text-surface text-sm px-3 py-2 rounded-md disabled:opacity-60">
            {busy && <Loader2 className="size-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
