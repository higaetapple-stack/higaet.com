import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Globe2, Send, GraduationCap, Award, Plane, Building2, MapPin } from "lucide-react";
import { askAdvisor, listAdvisorExplorers } from "@/lib/ai-advisor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/ai/global")({
  component: AdvisorPage,
});

type Msg = { role: "user" | "assistant"; content: string; sources?: any[] };

const SUGGESTIONS = [
  { icon: GraduationCap, label: "I have 65% in B.Tech and want an MS in AI in Germany. What are my options?" },
  { icon: MapPin, label: "Compare Canada vs Germany for an AI Masters." },
  { icon: Award, label: "Show scholarships for Indian students applying to Australia." },
  { icon: Plane, label: "What happens after I receive my offer letter for a student visa?" },
  { icon: Building2, label: "What documents do I need for a US university application?" },
];

function AdvisorPage() {
  const ask = useServerFn(askAdvisor);
  const explorers = useServerFn(listAdvisorExplorers);
  const expQuery = useQuery({ queryKey: ["advisor-explorers"], queryFn: () => explorers() });

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [countryId, setCountryId] = useState<string | undefined>();
  const [universityId, setUniversityId] = useState<string | undefined>();

  const m = useMutation({
    mutationFn: (prompt: string) =>
      ask({ data: { prompt, country_id: countryId, university_id: universityId } }),
    onSuccess: (res, prompt) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: prompt },
        { role: "assistant", content: res.response, sources: res.sources },
      ]);
      setInput("");
    },
  });

  function send(text: string) {
    const t = text.trim();
    if (!t || m.isPending) return;
    m.mutate(t);
  }

  const countries = expQuery.data?.countries ?? [];
  const universities = (expQuery.data?.universities ?? []).filter(
    (u: any) => !countryId || u.country_id === countryId,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-medium text-ink flex items-center gap-2">
          <Globe2 className="size-5 text-primary" /> Study Abroad Advisor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Grounded in HIGAET Global Education Hub — countries, universities, programs, scholarships, applications,
          and visa pathways. Informational guidance only; not legal or immigration advice.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-card ring-1 ring-border p-3">
          <label className="text-xs font-medium text-muted-foreground">Country focus (optional)</label>
          <select
            value={countryId ?? ""}
            onChange={(e) => {
              setCountryId(e.target.value || undefined);
              setUniversityId(undefined);
            }}
            className="mt-1 w-full rounded-md bg-background ring-1 ring-border p-2 text-sm"
          >
            <option value="">Any country</option>
            {countries.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="rounded-xl bg-card ring-1 ring-border p-3">
          <label className="text-xs font-medium text-muted-foreground">University focus (optional)</label>
          <select
            value={universityId ?? ""}
            onChange={(e) => setUniversityId(e.target.value || undefined)}
            className="mt-1 w-full rounded-md bg-background ring-1 ring-border p-2 text-sm"
          >
            <option value="">Any university</option>
            {universities.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => send(s.label)}
                className="text-left rounded-xl bg-card ring-1 ring-border p-4 hover:ring-primary/40 transition"
              >
                <Icon className="size-4 text-primary mb-2" />
                <p className="text-sm text-ink">{s.label}</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 ring-1 ${
              msg.role === "user" ? "bg-primary/5 ring-primary/20" : "bg-card ring-border"
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1">
              {msg.role === "user" ? "You" : "Advisor"}
            </div>
            <div className="text-sm text-ink whitespace-pre-wrap">{msg.content}</div>
            {msg.sources && msg.sources.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  {msg.sources.length} source{msg.sources.length === 1 ? "" : "s"}
                </summary>
                <div className="space-y-2 mt-2">
                  {msg.sources.map((s: any) => (
                    <div key={s.id} className="text-xs text-muted-foreground border-l-2 border-primary pl-2">
                      <div className="font-medium text-ink">
                        [{s.index}] {s.metadata?.title ?? "Knowledge chunk"}{" "}
                        <span className="text-muted-foreground">· sim {s.similarity.toFixed(3)}</span>
                      </div>
                      <div className="whitespace-pre-wrap mt-1">{s.snippet}…</div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
        {m.isPending && (
          <div className="rounded-xl bg-card ring-1 ring-border p-4 text-sm text-muted-foreground">
            Advisor is researching…
          </div>
        )}
        {m.error && (
          <div className="rounded-xl bg-red-50 ring-1 ring-red-200 p-4 text-sm text-red-700">
            {(m.error as Error).message}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-4 flex items-end gap-2 rounded-xl bg-card ring-1 ring-border p-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={2}
          placeholder="Ask about countries, universities, programs, scholarships, applications, or visas…"
          className="flex-1 resize-none rounded-md bg-background p-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={m.isPending || !input.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground text-sm px-3 py-2 disabled:opacity-50"
        >
          <Send className="size-4" /> Ask
        </button>
      </form>
    </div>
  );
}
