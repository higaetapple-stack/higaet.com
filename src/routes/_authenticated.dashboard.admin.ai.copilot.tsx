import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { askCopilot } from "@/lib/ai-copilot.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Mode =
  | "overview"
  | "student_summary"
  | "lead_summary"
  | "application_summary"
  | "visa_summary"
  | "project_summary"
  | "draft_email"
  | "draft_followup"
  | "draft_note"
  | "draft_placement_feedback"
  | "draft_project_update";

type EntityKind =
  | "student"
  | "enrollment"
  | "application"
  | "sa_application"
  | "academy_lead"
  | "sa_lead"
  | "tech_lead"
  | "visa_case"
  | "project";

const TAB_CONFIG: Array<{
  value: string;
  label: string;
  mode: Mode;
  entityKind?: EntityKind;
  placeholder: string;
  suggestions: string[];
}> = [
  {
    value: "overview",
    label: "Overview",
    mode: "overview",
    placeholder: "Ask anything across HIGAET (Academy, Global, Career, CRM, Tech)…",
    suggestions: [
      "Which programs map best to a student wanting to become an AI Engineer?",
      "Summarize open tech projects with overdue invoices",
      "What study-abroad countries are trending in our leads this month?",
    ],
  },
  {
    value: "student",
    label: "Student",
    mode: "student_summary",
    entityKind: "student",
    placeholder: "Anything specific to focus on?",
    suggestions: [
      "Give a full student readiness summary",
      "What are the risk indicators for this student?",
      "Recommend next actions for the counselor",
    ],
  },
  {
    value: "lead",
    label: "Lead",
    mode: "lead_summary",
    entityKind: "sa_lead",
    placeholder: "Focus area (intent, stage, next action)…",
    suggestions: [
      "Summarize lead intent and stage",
      "Estimate conversion probability with reasoning",
      "Suggest the next best CRM action",
    ],
  },
  {
    value: "application",
    label: "Application",
    mode: "application_summary",
    entityKind: "application",
    placeholder: "Focus area…",
    suggestions: [
      "Full application timeline and document status",
      "What's blocking submission?",
      "Visa readiness check",
    ],
  },
  {
    value: "visa",
    label: "Visa",
    mode: "visa_summary",
    entityKind: "visa_case",
    placeholder: "Focus area…",
    suggestions: [
      "Summarize current visa stage and missing docs",
      "List upcoming deadlines and risk flags",
      "Counselor next actions",
    ],
  },
  {
    value: "project",
    label: "Project",
    mode: "project_summary",
    entityKind: "project",
    placeholder: "Focus area…",
    suggestions: [
      "Full project status with milestones and blockers",
      "Invoice and payment status",
      "Open client requests and support tickets",
    ],
  },
  {
    value: "draft",
    label: "Draft",
    mode: "draft_email",
    placeholder: "Describe what to draft…",
    suggestions: [
      "Draft a follow-up email for a study-abroad lead who went silent for 2 weeks",
      "Draft a counselor note after a discovery call",
      "Draft a weekly project update for the client",
    ],
  },
];

const DRAFT_MODES: Array<{ value: Mode; label: string }> = [
  { value: "draft_email", label: "Email" },
  { value: "draft_followup", label: "CRM Follow-up" },
  { value: "draft_note", label: "Counselor Note" },
  { value: "draft_placement_feedback", label: "Placement Feedback" },
  { value: "draft_project_update", label: "Project Update" },
];

const LEAD_KINDS: Array<{ value: EntityKind; label: string }> = [
  { value: "sa_lead", label: "Study Abroad Lead" },
  { value: "academy_lead", label: "Academy Lead" },
  { value: "tech_lead", label: "Technology Lead" },
];

const APP_KINDS: Array<{ value: EntityKind; label: string }> = [
  { value: "application", label: "Application" },
  { value: "sa_application", label: "Study Abroad Application" },
];

export const Route = createFileRoute("/_authenticated/dashboard/admin/ai/copilot")({
  component: CopilotPage,
});

function CopilotPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">HIGAET Copilot</h1>
          <p className="text-muted-foreground">
            Internal AI for staff — cross-collection retrieval, summaries, and human-reviewed drafts.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          {TAB_CONFIG.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_CONFIG.map((cfg) => (
          <TabsContent key={cfg.value} value={cfg.value} className="mt-4">
            <CopilotPanel config={cfg} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function CopilotPanel({ config }: { config: (typeof TAB_CONFIG)[number] }) {
  const ask = useServerFn(askCopilot);
  const [prompt, setPrompt] = useState("");
  const [entityId, setEntityId] = useState("");
  const [entityKind, setEntityKind] = useState<EntityKind | undefined>(config.entityKind);
  const [mode, setMode] = useState<Mode>(config.mode);

  const showEntity = useMemo(
    () => !!config.entityKind || config.value === "draft",
    [config],
  );
  const showLeadKindSelect = config.value === "lead";
  const showAppKindSelect = config.value === "application";
  const isDraft = config.value === "draft";

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = { prompt: prompt.trim(), mode };
      if (entityKind && entityId.trim()) {
        payload.entity = { kind: entityKind, id: entityId.trim() };
      }
      return ask({ data: payload });
    },
    onError: (e: any) => toast.error(e?.message ?? "Copilot failed"),
  });

  const result = mutation.data;
  const canSubmit = prompt.trim().length > 0 && !mutation.isPending;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{config.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDraft && (
            <div>
              <Label>Draft type</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DRAFT_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showLeadKindSelect && (
            <div>
              <Label>Lead type</Label>
              <Select value={entityKind} onValueChange={(v) => setEntityKind(v as EntityKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showAppKindSelect && (
            <div>
              <Label>Application type</Label>
              <Select value={entityKind} onValueChange={(v) => setEntityKind(v as EntityKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APP_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showEntity && (
            <div>
              <Label>Record ID {isDraft && <span className="text-muted-foreground">(optional)</span>}</Label>
              <Input
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="UUID of the record"
              />
            </div>
          )}

          <div>
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={config.placeholder}
              rows={4}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {config.suggestions.map((s) => (
              <Button key={s} type="button" variant="outline" size="sm" onClick={() => setPrompt(s)}>
                {s}
              </Button>
            ))}
          </div>

          <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Ask Copilot
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Response
              {result.entity_loaded && <Badge variant="secondary">Record loaded</Badge>}
              <Badge variant="outline">{result.latency_ms}ms</Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(result.response);
                toast.success("Copied");
              }}
            >
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{result.response}</pre>
            {result.sources.length > 0 && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  {result.sources.length} source{result.sources.length === 1 ? "" : "s"}
                </summary>
                <div className="mt-2 space-y-2">
                  {result.sources.map((s) => (
                    <div key={s.id} className="border rounded p-2 bg-muted/30">
                      <div className="font-mono text-[10px] text-muted-foreground">
                        [{s.index}] sim={s.similarity.toFixed(3)}
                      </div>
                      <div className="mt-1">{s.snippet}…</div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
