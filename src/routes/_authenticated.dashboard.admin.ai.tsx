import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Database, Layers, Wand2, Bot, Search, Play, Plus, RefreshCw } from "lucide-react";
import {
  listCollections,
  upsertCollection,
  ingestDocument,
  processEmbeddingQueue,
  searchKnowledge,
  listAgents,
  upsertAgent,
  runAgent,
  knowledgeKpis,
} from "@/lib/ai-knowledge.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/ai")({
  component: AiPlayground,
});

type Tab = "overview" | "collections" | "ingest" | "search" | "agents" | "playground";

function AiPlayground() {
  const [tab, setTab] = useState<Tab>("overview");
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "collections", label: "Collections", icon: Layers },
    { id: "ingest", label: "Ingest", icon: Database },
    { id: "search", label: "Retrieval", icon: Search },
    { id: "agents", label: "Agents", icon: Bot },
    { id: "playground", label: "Playground", icon: Play },
  ];
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink flex items-center gap-2">
            <Sparkles className="size-5 text-violet-500" /> HIGAET AI Platform
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Knowledge Intelligence Platform · Sprint 6A · admin-only
          </p>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-t-md border-b-2 -mb-px transition ${
                active
                  ? "border-violet-500 text-ink bg-card"
                  : "border-transparent text-muted-foreground hover:text-ink"
              }`}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </nav>

      <div>
        {tab === "overview" && <OverviewTab />}
        {tab === "collections" && <CollectionsTab />}
        {tab === "ingest" && <IngestTab />}
        {tab === "search" && <SearchTab />}
        {tab === "agents" && <AgentsTab />}
        {tab === "playground" && <PlaygroundTab />}
      </div>
    </div>
  );
}

// ---------------- Overview ----------------
function OverviewTab() {
  const fetchKpis = useServerFn(knowledgeKpis);
  const processQueue = useServerFn(processEmbeddingQueue);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["ai-kpis"], queryFn: () => fetchKpis() });
  const m = useMutation({
    mutationFn: () => processQueue({ data: { batch: 10 } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-kpis"] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const items = [
    { label: "Collections", value: data?.collections ?? 0 },
    { label: "Documents", value: data?.documents ?? 0 },
    { label: "Chunks", value: data?.chunks ?? 0 },
    { label: "Pending embeddings", value: data?.pending_embeddings ?? 0 },
    { label: "Failed embeddings", value: data?.failed_embeddings ?? 0 },
    { label: "Agents", value: data?.agents ?? 0 },
  ];
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl bg-card ring-1 ring-border p-4">
            <div className="text-xs text-muted-foreground">{i.label}</div>
            <div className="text-2xl font-display text-ink mt-1">{i.value}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white text-sm px-3 py-2 hover:bg-violet-500 disabled:opacity-50"
      >
        <Wand2 className="size-4" />
        {m.isPending ? "Embedding…" : "Process embedding queue (10)"}
      </button>
      {m.data && (
        <p className="text-xs text-muted-foreground">
          Processed {m.data.processed} · Failed {m.data.failed}
        </p>
      )}
    </div>
  );
}

// ---------------- Collections ----------------
function CollectionsTab() {
  const fetchList = useServerFn(listCollections);
  const upsert = useServerFn(upsertCollection);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["ai-collections"], queryFn: () => fetchList() });
  const [form, setForm] = useState({ slug: "", name: "", description: "" });
  const m = useMutation({
    mutationFn: () => upsert({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-collections"] });
      setForm({ slug: "", name: "", description: "" });
    },
  });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-xl ring-1 ring-border bg-card p-4 space-y-2">
        <h3 className="text-sm font-medium text-ink">Collections</h3>
        <ul className="divide-y divide-border text-sm">
          {(data ?? []).map((c: any) => (
            <li key={c.id} className="py-2">
              <div className="font-medium text-ink">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.slug}</div>
              {c.description && <div className="text-xs text-muted-foreground mt-1">{c.description}</div>}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl ring-1 ring-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-ink flex items-center gap-2">
          <Plus className="size-4" /> New / update collection
        </h3>
        <Input label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
        <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || !form.slug || !form.name}
          className="rounded-lg bg-violet-600 text-white text-sm px-3 py-2 disabled:opacity-50"
        >
          {m.isPending ? "Saving…" : "Save collection"}
        </button>
        {m.error && <p className="text-xs text-red-600">{(m.error as Error).message}</p>}
      </div>
    </div>
  );
}

// ---------------- Ingest ----------------
function IngestTab() {
  const fetchList = useServerFn(listCollections);
  const ingest = useServerFn(ingestDocument);
  const { data } = useQuery({ queryKey: ["ai-collections"], queryFn: () => fetchList() });
  const [form, setForm] = useState({ collection_id: "", title: "", content: "" });
  const m = useMutation({ mutationFn: () => ingest({ data: form }) });
  return (
    <div className="rounded-xl ring-1 ring-border bg-card p-4 space-y-3 max-w-3xl">
      <h3 className="text-sm font-medium text-ink">Ingest document</h3>
      <Select
        label="Collection"
        value={form.collection_id}
        onChange={(v) => setForm({ ...form, collection_id: v })}
        options={[
          { value: "", label: "Select collection…" },
          ...(data ?? []).map((c: any) => ({ value: c.id, label: c.name })),
        ]}
      />
      <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <div>
        <label className="text-xs text-muted-foreground">Content (paste raw text)</label>
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={10}
          className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
        />
      </div>
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending || !form.collection_id || !form.title || !form.content}
        className="rounded-lg bg-violet-600 text-white text-sm px-3 py-2 disabled:opacity-50"
      >
        {m.isPending ? "Chunking…" : "Ingest & chunk"}
      </button>
      {m.data && (
        <p className="text-xs text-muted-foreground">
          Document {m.data.document_id} · {m.data.chunks} chunks queued. Run “Process embedding queue” on Overview.
        </p>
      )}
      {m.error && <p className="text-xs text-red-600">{(m.error as Error).message}</p>}
    </div>
  );
}

// ---------------- Search ----------------
function SearchTab() {
  const fetchList = useServerFn(listCollections);
  const search = useServerFn(searchKnowledge);
  const { data: collections } = useQuery({ queryKey: ["ai-collections"], queryFn: () => fetchList() });
  const [query, setQuery] = useState("");
  const [coll, setColl] = useState("");
  const m = useMutation({
    mutationFn: () =>
      search({
        data: {
          query,
          match_count: 8,
          collection_ids: coll ? [coll] : undefined,
        },
      }),
  });
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-xl ring-1 ring-border bg-card p-4 space-y-3">
        <Input label="Query" value={query} onChange={setQuery} />
        <Select
          label="Collection (optional)"
          value={coll}
          onChange={setColl}
          options={[
            { value: "", label: "All collections" },
            ...(collections ?? []).map((c: any) => ({ value: c.id, label: c.name })),
          ]}
        />
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || !query}
          className="rounded-lg bg-violet-600 text-white text-sm px-3 py-2 disabled:opacity-50"
        >
          {m.isPending ? "Searching…" : "Retrieve"}
        </button>
      </div>
      {m.data && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {m.data.matches.length} matches · {m.data.latency_ms} ms
          </p>
          {m.data.matches.map((c: any, i: number) => (
            <div key={c.id} className="rounded-lg ring-1 ring-border bg-card p-3">
              <div className="text-xs text-muted-foreground">
                #{i + 1} · similarity {Number(c.similarity).toFixed(3)}
              </div>
              <div className="text-sm text-ink mt-1 whitespace-pre-wrap">{c.chunk_text}</div>
            </div>
          ))}
        </div>
      )}
      {m.error && <p className="text-xs text-red-600">{(m.error as Error).message}</p>}
    </div>
  );
}

// ---------------- Agents ----------------
function AgentsTab() {
  const fetchList = useServerFn(listAgents);
  const fetchColls = useServerFn(listCollections);
  const upsert = useServerFn(upsertAgent);
  const qc = useQueryClient();
  const { data: agents } = useQuery({ queryKey: ["ai-agents"], queryFn: () => fetchList() });
  const { data: collections } = useQuery({ queryKey: ["ai-collections"], queryFn: () => fetchColls() });
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    system_prompt: "You are a helpful HIGAET assistant. Use the provided knowledge to answer accurately.",
    model: "google/gemini-3-flash-preview",
    temperature: 0.3,
    collection_ids: [] as string[],
    max_chunks: 8,
    enabled: true,
    visibility: "admin" as const,
  });
  const m = useMutation({
    mutationFn: () => upsert({ data: form }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-agents"] }),
  });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-xl ring-1 ring-border bg-card p-4 space-y-2">
        <h3 className="text-sm font-medium text-ink">Registered agents</h3>
        <ul className="divide-y divide-border text-sm">
          {(agents ?? []).map((a: any) => (
            <li key={a.id} className="py-2">
              <div className="font-medium text-ink">
                {a.name} <span className="text-xs text-muted-foreground">· {a.slug}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {a.model} · temp {a.temperature} · {a.enabled ? "enabled" : "disabled"} · {a.visibility}
              </div>
              {a.description && <div className="text-xs text-muted-foreground mt-1">{a.description}</div>}
            </li>
          ))}
          {(!agents || agents.length === 0) && (
            <li className="py-2 text-xs text-muted-foreground">No agents yet.</li>
          )}
        </ul>
      </div>
      <div className="rounded-xl ring-1 ring-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-ink">Create / update agent</h3>
        <Input label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
        <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <div>
          <label className="text-xs text-muted-foreground">System prompt</label>
          <textarea
            value={form.system_prompt}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
            rows={4}
            className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>
        <Input label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Temperature"
            value={String(form.temperature)}
            onChange={(v) => setForm({ ...form, temperature: Number(v) || 0 })}
          />
          <Input
            label="Max chunks"
            value={String(form.max_chunks)}
            onChange={(v) => setForm({ ...form, max_chunks: Number(v) || 8 })}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Collections (allowed scope)</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {(collections ?? []).map((c: any) => {
              const on = form.collection_ids.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      collection_ids: on
                        ? form.collection_ids.filter((x) => x !== c.id)
                        : [...form.collection_ids, c.id],
                    })
                  }
                  className={`text-xs px-2 py-1 rounded-md ring-1 ${
                    on ? "bg-violet-600 text-white ring-violet-600" : "ring-border text-muted-foreground"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || !form.slug || !form.name || !form.system_prompt}
          className="rounded-lg bg-violet-600 text-white text-sm px-3 py-2 disabled:opacity-50"
        >
          {m.isPending ? "Saving…" : "Save agent"}
        </button>
        {m.error && <p className="text-xs text-red-600">{(m.error as Error).message}</p>}
      </div>
    </div>
  );
}

// ---------------- Playground ----------------
function PlaygroundTab() {
  const fetchAgents = useServerFn(listAgents);
  const run = useServerFn(runAgent);
  const { data: agents } = useQuery({ queryKey: ["ai-agents"], queryFn: () => fetchAgents() });
  const [agentId, setAgentId] = useState("");
  const [prompt, setPrompt] = useState("");
  const m = useMutation({ mutationFn: () => run({ data: { agent_id: agentId, prompt } }) });
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-xl ring-1 ring-border bg-card p-4 space-y-3">
        <Select
          label="Agent"
          value={agentId}
          onChange={setAgentId}
          options={[
            { value: "", label: "Select agent…" },
            ...(agents ?? []).map((a: any) => ({ value: a.id, label: a.name })),
          ]}
        />
        <div>
          <label className="text-xs text-muted-foreground">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending || !agentId || !prompt}
          className="rounded-lg bg-violet-600 text-white text-sm px-3 py-2 disabled:opacity-50"
        >
          {m.isPending ? "Running…" : "Run agent"}
        </button>
      </div>
      {m.data && (
        <div className="space-y-3">
          <div className="rounded-xl ring-1 ring-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">Response · {m.data.latency_ms} ms</div>
            <div className="text-sm text-ink whitespace-pre-wrap">{m.data.response}</div>
          </div>
          <details className="rounded-xl ring-1 ring-border bg-card p-4">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              {m.data.chunks.length} sources used
            </summary>
            <div className="space-y-2 mt-2">
              {m.data.chunks.map((c: any, i: number) => (
                <div key={c.id} className="text-xs text-muted-foreground border-l-2 border-violet-500 pl-2">
                  <div>
                    [{i + 1}] sim {Number(c.similarity).toFixed(3)}
                  </div>
                  <div className="whitespace-pre-wrap">{c.chunk_text}</div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      {m.error && <p className="text-xs text-red-600">{(m.error as Error).message}</p>}
    </div>
  );
}

// ---------------- Tiny inputs ----------------
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
      />
    </div>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
