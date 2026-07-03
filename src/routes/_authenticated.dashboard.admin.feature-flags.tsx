import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flag, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/admin/feature-flags")({
  component: FeatureFlagsPage,
});

type Env = "development" | "staging" | "production";

type Flag = {
  key: string;
  label: string;
  description: string;
  defaults: Record<Env, boolean>;
};

// Experimental / gated features. Add new flags here as they land.
const FLAGS: Flag[] = [
  {
    key: "ai_tutor_v2",
    label: "AI Tutor v2 (RAG streaming)",
    description: "Enables the streaming RAG tutor with citations in course lessons.",
    defaults: { development: true, staging: true, production: false },
  },
  {
    key: "study_abroad_visa_copilot",
    label: "Visa Copilot",
    description: "Assistant that pre-fills visa applications from applicant profile.",
    defaults: { development: true, staging: false, production: false },
  },
  {
    key: "placements_auto_match",
    label: "Placements Auto-Match",
    description: "Auto-suggest employers for eligible students on the placements board.",
    defaults: { development: true, staging: true, production: false },
  },
  {
    key: "tech_projects_client_portal",
    label: "Client Portal for Tech Projects",
    description: "External client login area for milestones, invoices, and tickets.",
    defaults: { development: true, staging: true, production: true },
  },
  {
    key: "notifications_digest",
    label: "Daily Notifications Digest",
    description: "Bundles low-priority notifications into a single daily email.",
    defaults: { development: true, staging: false, production: false },
  },
  {
    key: "community_reactions",
    label: "Community Reactions",
    description: "Emoji reactions on threads and replies.",
    defaults: { development: true, staging: true, production: true },
  },
  {
    key: "mcp_public_tools",
    label: "MCP Public Tools",
    description: "Expose the /mcp endpoint with read-only HIGAET tools for AI clients.",
    defaults: { development: true, staging: true, production: false },
  },
];

const STORAGE_KEY = "higaet:feature-flags";

function detectEnv(): Env {
  if (typeof window === "undefined") return "development";
  const h = window.location.hostname;
  if (h.includes("staging.")) return "staging";
  if (h === "higaet.com" || h.endsWith(".higaet.com")) return "production";
  if (h.endsWith(".lovable.app") && !h.includes("preview")) return "production";
  return "development";
}

type Overrides = Partial<Record<Env, Partial<Record<string, boolean>>>>;

function loadOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}

function saveOverrides(o: Overrides) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
}

function FeatureFlagsPage() {
  const detected = useMemo(detectEnv, []);
  const [env, setEnv] = useState<Env>(detected);
  const [overrides, setOverrides] = useState<Overrides>({});

  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

  const envOverrides = overrides[env] ?? {};

  const setFlag = (key: string, value: boolean, defaultVal: boolean) => {
    const next: Overrides = { ...overrides, [env]: { ...(overrides[env] ?? {}) } };
    if (value === defaultVal) {
      delete next[env]![key];
    } else {
      next[env]![key] = value;
    }
    if (next[env] && Object.keys(next[env]!).length === 0) delete next[env];
    setOverrides(next);
    saveOverrides(next);
    toast.success(`${key} → ${value ? "on" : "off"} (${env})`);
  };

  const resetEnv = () => {
    const next = { ...overrides };
    delete next[env];
    setOverrides(next);
    saveOverrides(next);
    toast.success(`Reset overrides for ${env}`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center size-8 rounded-lg bg-academy/10 text-academy">
              <Flag className="size-4" />
            </span>
            <h2 className="font-display text-lg font-medium text-ink">Feature Flags</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Toggle experimental features per environment. Overrides are stored locally per admin;
            defaults reflect the platform baseline for each environment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
            detected: {detected}
          </Badge>
          <Select value={env} onValueChange={(v) => setEnv(v as Env)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={resetEnv}>
            <RotateCcw className="size-3.5 mr-1" /> Reset {env}
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Flag</th>
              <th className="text-left px-4 py-2 font-medium w-40">Default ({env})</th>
              <th className="text-right px-4 py-2 font-medium w-28">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {FLAGS.map((f) => {
              const def = f.defaults[env];
              const overridden = f.key in envOverrides;
              const value = overridden ? !!envOverrides[f.key] : def;
              return (
                <tr key={f.key} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-ink">{f.label}</div>
                      {overridden && (
                        <Badge variant="outline" className="text-[10px]">overridden</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{f.description}</div>
                    <code className="text-[11px] text-muted-foreground/80">{f.key}</code>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={def ? "default" : "secondary"}>{def ? "on" : "off"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Switch
                      checked={value}
                      onCheckedChange={(v) => setFlag(f.key, v, def)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3">
        Note: overrides here are per-admin (localStorage). To push a flag globally, change its default
        in <code>src/routes/_authenticated.dashboard.admin.feature-flags.tsx</code> and ship a release.
      </p>
    </div>
  );
}
