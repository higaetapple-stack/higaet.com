import { useEffect, useState } from "react";

type CapturedError = {
  message: string;
  stack?: string;
  source: "error" | "unhandledrejection";
  at: number;
};

/**
 * Dev-only overlay that captures window errors + unhandled promise rejections
 * and shows the full stack trace. Renders nothing in production.
 */
export function DevErrorOverlay() {
  const [errors, setErrors] = useState<CapturedError[]>([]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const push = (e: CapturedError) =>
      setErrors((prev) => [e, ...prev].slice(0, 10));

    const onError = (ev: ErrorEvent) => {
      push({
        message: ev.message || String(ev.error),
        stack: ev.error?.stack,
        source: "error",
        at: Date.now(),
      });
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason;
      push({
        message: reason?.message ?? String(reason),
        stack: reason?.stack,
        source: "unhandledrejection",
        at: Date.now(),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!import.meta.env.DEV || errors.length === 0) return null;

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
        </strong>
        <button
          onClick={() => setErrors([])}
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
