import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Send, BookOpen, Compass, ClipboardList } from "lucide-react";
import { askTutor } from "@/lib/ai-tutor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/ai/tutor")({
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string; sources?: any[] };

const SUGGESTIONS = [
  { icon: BookOpen, label: "Explain prompt chaining with a simple example." },
  { icon: ClipboardList, label: "How should I approach my first AI Engineering assignment?" },
  { icon: Compass, label: "Suggest a learning roadmap to become an AI Engineer at HIGAET." },
];

function TutorPage() {
  const ask = useServerFn(askTutor);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const m = useMutation({
    mutationFn: (prompt: string) => ask({ data: { prompt } }),
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-medium text-ink flex items-center gap-2">
          <Sparkles className="size-5 text-academy" /> Academy AI Tutor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Grounded in HIGAET Academy programs, courses, lessons, assignments, and projects. Always cites sources.
        </p>
      </header>

      {messages.length === 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => send(s.label)}
                className="text-left rounded-xl bg-card ring-1 ring-border p-4 hover:ring-academy/40 transition"
              >
                <Icon className="size-4 text-academy mb-2" />
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
              msg.role === "user" ? "bg-academy/5 ring-academy/20" : "bg-card ring-border"
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1">
              {msg.role === "user" ? "You" : "Tutor"}
            </div>
            <div className="text-sm text-ink whitespace-pre-wrap">{msg.content}</div>
            {msg.sources && msg.sources.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  {msg.sources.length} source{msg.sources.length === 1 ? "" : "s"}
                </summary>
                <div className="space-y-2 mt-2">
                  {msg.sources.map((s: any) => (
                    <div key={s.id} className="text-xs text-muted-foreground border-l-2 border-academy pl-2">
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
            Tutor is thinking…
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
          placeholder="Ask about a program, course, lesson, or assignment…"
          className="flex-1 resize-none rounded-md bg-background p-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={m.isPending || !input.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-academy text-white text-sm px-3 py-2 disabled:opacity-50"
        >
          <Send className="size-4" /> Ask
        </button>
      </form>
    </div>
  );
}
