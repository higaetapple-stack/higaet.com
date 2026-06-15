import { useEffect, useState } from "react";

type CapturedError = {
  message: string;
  stack?: string;
  source: "error" | "unhandledrejection";
  at: number;
};

// Intentional system-level errors thrown by B.10–B.45 layers — not bugs.
const IGNORED_NAMES = [
  "AgentBlockedError",
  "B10ValidationError",
  "WorkflowGateError",
  "StrategyRejectedError",
] as const;
type IgnoredName = (typeof IGNORED_NAMES)[number];

/**
 * Dev-only overlay that captures window errors + unhandled promise rejections
 * and shows the full stack trace. Renders nothing in production.
 * Also tracks counts of suppressed intentional system errors as telemetry.
 */
export function DevErrorOverlay() {
  const [errors, setErrors] = useState<CapturedError[]>([]);
  const [counters, setCounters] = useState<Record<IgnoredName, number>>(() =>
    Object.fromEntries(IGNORED_NAMES.map((n) => [n, 0])) as Record<IgnoredName, number>,
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const ignored = new Set<string>(IGNORED_NAMES);
    const seen = new Map<string, number>();
    const DEDUPE_MS = 2000;

    const push = (e: CapturedError, name?: string) => {
      if (name && ignored.has(name)) {
        setCounters((c) => ({ ...c, [name as IgnoredName]: c[name as IgnoredName] + 1 }));
        return;
      }
      const key = `${e.source}:${e.message}`;
      const now = Date.now();
      const last = seen.get(key);
      if (last && now - last < DEDUPE_MS) return;
      seen.set(key, now);
      setErrors((prev) => [e, ...prev].slice(0, 10));
    };

    const onError = (ev: ErrorEvent) => {
      push(
        {
          message: ev.message || String(ev.error),
          stack: ev.error?.stack,
          source: "error",
          at: Date.now(),
        },
        ev.error?.name,
      );
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason;
      push(
        {
          message: reason?.message ?? String(reason),
          stack: reason?.stack,
          source: "unhandledrejection",
          at: Date.now(),
        },
        reason?.name,
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!import.meta.env.DEV) return null;
  const totalSuppressed = Object.values(counters).reduce((a, b) => a + b, 0);
  if (errors.length === 0 && totalSuppressed === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: "auto 0 0 0",
        zIndex: 2147483647,
        maxHeight: "50vh",
        overflow: "auto",
        background: "#1a0000",
        color: "#ffd6d6",
        borderTop: "2px solid #ff4d4d",
        font: "12px ui-monospace, SFMono-Regular, Menlo, monospace",
        padding: "12px 16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <strong style={{ color: "#ff8a8a" }}>
          DevErrorOverlay — {errors.length} error{errors.length === 1 ? "" : "s"}
          {totalSuppressed > 0 ? ` · ${totalSuppressed} suppressed` : ""}
        </strong>
        <button
          onClick={() => {
            setErrors([]);
            setCounters(
              Object.fromEntries(IGNORED_NAMES.map((n) => [n, 0])) as Record<IgnoredName, number>,
            );
          }}
          style={{
            background: "transparent",
            color: "#ffd6d6",
            border: "1px solid #ff4d4d",
            borderRadius: 4,
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      {totalSuppressed > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: "1px dashed #5a1a1a",
          }}
        >
          {IGNORED_NAMES.filter((n) => counters[n] > 0).map((n) => (
            <span
              key={n}
              style={{
                background: "#2a0a0a",
                border: "1px solid #5a1a1a",
                borderRadius: 4,
                padding: "2px 6px",
                color: "#ffbaba",
              }}
              title="Suppressed intentional system signal"
            >
              {n}: {counters[n]}
            </span>
          ))}
        </div>
      )}

      {errors.map((e, i) => (
        <details key={`${e.at}-${i}`} open={i === 0} style={{ marginBottom: 8 }}>
          <summary style={{ cursor: "pointer", color: "#ff8a8a" }}>
            [{e.source}] {e.message}
          </summary>
          <pre style={{ whiteSpace: "pre-wrap", margin: "6px 0 0", color: "#ffd6d6" }}>
            {e.stack ?? "(no stack)"}
          </pre>
        </details>
      ))}
    </div>
  );
}
