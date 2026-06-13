import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, Send, FileText, Map, Image, MessagesSquare, Target } from "lucide-react";
import { askCoach } from "@/lib/ai-coach.functions";

export const Route = createFileRoute("/_authenticated/dashboard/ai/career")({
  component: CoachPage,
});

type Mode = "general" | "resume_review" | "roadmap" | "portfolio" | "interview" | "job_fit";
type Msg = { role: "user" | "assistant"; content: string; sources?: any[] };

const MODES: { value: Mode; label: string; icon: any; hint: string }[] = [
  { value: "general", label: "General", icon: MessagesSquare, hint: "Ask anything career-related." },
  { value: "resume_review", label: "Resume Review", icon: FileText, hint: "Paste your resume + target role." },
  { value: "roadmap", label: "Roadmap", icon: Map, hint: "Plan your path to a role using HIGAET programs." },
  { value: "portfolio", label: "Portfolio", icon: Image, hint: "Share project links or descriptions." },
  { value: "interview", label: "Interview", icon: MessagesSquare, hint: "Get practice questions and tasks." },
  { value: "job_fit", label: "Job Fit", icon: Target, hint: "Paste a job description to compare." },
];

function CoachPage() {
  const coach = useServerFn(askCoach);
  const [mode, setMode] = useState<Mode>("general");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const m = useMutation({
    mutationFn: (prompt: string) =>
      coach({
        data: {
          prompt,
          mode,
          target_role: targetRole || undefined,
          resume_text: ["resume_review", "job_fit", "roadmap"].includes(mode) ? resumeText || undefined : undefined,
          job_description: mode === "job_fit" ? jobDescription || undefined : undefined,
        },
      }),
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

  const activeMode = MODES.find((mo) => mo.value === mode)!;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-medium text-ink flex items-center gap-2">
          <Briefcase className="size-5 text-primary" /> Career Coach
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Grounded in HIGAET programs, certificates, projects, jobs, and placement data. Coaches, never ghostwrites.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {MODES.map((mo) => {
          const Icon = mo.icon;
          const active = mo.value === mode;
          return (
            <button
              key={mo.value}
              onClick={() => setMode(mo.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ring-1 transition ${
                active
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-card text-ink ring-border hover:ring-primary/40"
              }`}
            >
              <Icon className="size-3.5" />
              {mo.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground -mt-3">{activeMode.hint}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-card ring-1 ring-border p-3 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Target role (optional)</label>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. AI Engineer, ML Engineer, Data Scientist"
            className="mt-1 w-full rounded-md bg-background ring-1 ring-border p-2 text-sm outline-none"
          />
        </div>

        {["resume_review", "job_fit", "roadmap"].includes(mode) && (
          <div className="rounded-xl bg-card ring-1 ring-border p-3 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Resume (paste plain text)</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
              placeholder="Paste your resume text here. No formatting needed."
              className="mt-1 w-full resize-y rounded-md bg-background ring-1 ring-border p-2 text-sm outline-none"
            />
          </div>
        )}

        {mode === "job_fit" && (
          <div className="rounded-xl bg-card ring-1 ring-border p-3 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Job description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Paste the job description here."
              className="mt-1 w-full resize-y rounded-md bg-background ring-1 ring-border p-2 text-sm outline-none"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 ring-1 ${
              msg.role === "user" ? "bg-primary/5 ring-primary/20" : "bg-card ring-border"
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1">
              {msg.role === "user" ? "You" : "Coach"}
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
            Coach is preparing your feedback…
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
          placeholder={`Ask the coach (${activeMode.label})…`}
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
