/**
 * Step-by-step incident replay UI. Advisory only — no actions, no mutations.
 */

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause, TrendingUp } from "lucide-react";
import type { IncidentReplay } from "@/lib/replay/types";

export function IncidentReplayPanel({ data }: { data: IncidentReplay }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = data.steps[index];
  const snapshot = data.timeline[index];

  useAutoAdvance(playing, index, data.steps.length, setIndex, setPlaying);

  const durationLabel = useMemo(
    () => formatDuration(data.summary.durationMs),
    [data.summary.durationMs],
  );
  const detectionLabel = useMemo(
    () =>
      data.summary.timeToConfidentDetectionMs !== undefined
        ? formatDuration(data.summary.timeToConfidentDetectionMs)
        : "—",
    [data.summary.timeToConfidentDetectionMs],
  );

  if (data.steps.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        No events available to replay for this issue.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Events" value={data.summary.totalEvents} />
        <Stat label="Duration" value={durationLabel} />
        <Stat label="Peak err/min" value={data.summary.peakErrorRate.toFixed(2)} />
        <Stat label="Time-to-detect" value={detectionLabel} />
        <Stat
          label="Final"
          value={`${data.summary.finalCategory} · ${Math.round(data.summary.finalConfidence * 100)}%`}
        />
      </div>

      <Card className="p-5 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Step {index + 1} / {data.steps.length}
            </div>
            <h3 className="font-semibold">{data.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPlaying(false);
                setIndex(Math.max(0, index - 1));
              }}
              disabled={index === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlaying((p) => !p)}
              disabled={index >= data.steps.length - 1 && !playing}
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPlaying(false);
                setIndex(Math.min(data.steps.length - 1, index + 1));
              }}
              disabled={index >= data.steps.length - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </header>

        <input
          type="range"
          min={0}
          max={data.steps.length - 1}
          value={index}
          onChange={(e) => {
            setPlaying(false);
            setIndex(Number(e.target.value));
          }}
          className="w-full"
          aria-label="Timeline scrubber"
        />

        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <MiniStat
            label="Timestamp"
            value={new Date(step.timestamp).toLocaleString()}
          />
          <MiniStat
            label="Event count"
            value={String(step.eventCount)}
            hint={`err/min: ${snapshot?.cumulativeErrorRate.toFixed(2) ?? "—"}`}
          />
          <MiniStat
            label="Risk score"
            value={step.riskScore.toFixed(2)}
            hint={step.systemic ? "systemic" : "isolated"}
          />
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Root-cause reasoning
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="capitalize">{step.rootCause}</Badge>
            <Badge variant={step.confidence >= 0.7 ? "default" : "secondary"}>
              {Math.round(step.confidence * 100)}% confidence
            </Badge>
            {step.detectionDelta?.newHypothesis && index > 0 && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="size-3" /> new hypothesis
              </Badge>
            )}
            {step.detectionDelta && step.detectionDelta.confidenceDelta > 0.05 && (
              <span className="text-xs text-emerald-600">
                +{Math.round(step.detectionDelta.confidenceDelta * 100)}pp
              </span>
            )}
          </div>
          <ul className="space-y-1 text-sm">
            {step.hypotheses.map((h, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                  {h.category}
                </Badge>
                <span>{h.description}</span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  w={h.weight.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {step.fixPlan.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Fix plan at this step
            </div>
            <ul className="space-y-1.5 text-sm">
              {step.fixPlan.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Badge
                    variant={
                      f.risk === "high"
                        ? "destructive"
                        : f.risk === "medium"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-[10px]"
                  >
                    {f.risk}
                  </Badge>
                  <span className="font-medium">{f.action}</span>
                  <Badge variant="outline" className="text-[10px] capitalize ml-auto">
                    {f.category}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold mt-0.5 truncate">{value}</div>
    </Card>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded border border-border/50 p-2.5">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-medium">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function useAutoAdvance(
  playing: boolean,
  index: number,
  length: number,
  setIndex: (i: number) => void,
  setPlaying: (p: boolean) => void,
) {
  useEffectSafe(() => {
    if (!playing) return;
    if (index >= length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex(index + 1), 900);
    return () => clearTimeout(t);
  }, [playing, index, length]);
}

// Small useEffect wrapper to keep import surface tight.
import { useEffect as useEffectSafe } from "react";

function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
