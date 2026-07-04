/**
 * Incident clustering primitives — pure, dependency-free, deterministic.
 *
 * Groups noisy Sentry issues into a single "incident" so downstream systems
 * (AI SRE analysis, PR drafts, dashboards) act on root causes, not events.
 *
 * The signature is a stable fingerprint over normalized error identity:
 *   - errorType (e.g. TypeError)
 *   - top user frame (filename + function)
 *   - message shape (numbers/uuids/urls stripped)
 *   - route/culprit
 *
 * Two incidents share a cluster iff their signatures match.
 */

import type { AISREIncident } from "@/lib/sre/ai/orchestrator";

export interface IncidentSignatureInput {
  errorType?: string | null;
  errorValue?: string | null;
  culprit?: string | null;
  frames?: Array<{ filename?: string; function?: string }>;
}

const NODE_MODULE_HINT = /node_modules|dist\/vendor|\.chunk\./i;

/** Strip volatile bits from an error message so `foo(42)` and `foo(43)` cluster. */
export function normalizeMessage(msg: string | null | undefined): string {
  if (!msg) return "";
  return msg
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<uuid>")
    .replace(/\b0x[0-9a-f]+\b/gi, "<hex>")
    .replace(/\b\d{4,}\b/g, "<num>")
    .replace(/https?:\/\/\S+/gi, "<url>")
    .replace(/["'`]/g, "")
    .trim()
    .slice(0, 200)
    .toLowerCase();
}

export function pickTopUserFrame(
  frames: IncidentSignatureInput["frames"],
): { filename: string; function: string } {
  const list = frames ?? [];
  const user = list.find((f) => f.filename && !NODE_MODULE_HINT.test(f.filename)) ?? list[0];
  return {
    filename: (user?.filename ?? "").replace(/^.*\/(src|app)\//, "$1/").slice(0, 160),
    function: (user?.function ?? "").slice(0, 120),
  };
}

/** FNV-1a 64-bit — no crypto import, safe in every runtime, plenty for grouping. */
export function fnv1a(str: string): string {
  let h1 = 0xcbf29ce4 >>> 0;
  let h2 = 0x84222325 >>> 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 ^= c;
    h2 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}

export function computeIncidentSignature(input: IncidentSignatureInput): string {
  const frame = pickTopUserFrame(input.frames);
  const parts = [
    (input.errorType ?? "unknown").trim().toLowerCase(),
    normalizeMessage(input.errorValue),
    frame.filename,
    frame.function,
    (input.culprit ?? "").trim().toLowerCase().slice(0, 160),
  ];
  return fnv1a(parts.join("|"));
}

export function signatureFromIncident(incident: AISREIncident): string {
  return computeIncidentSignature({
    errorType: incident.errorType,
    errorValue: incident.errorValue,
    culprit: incident.culprit,
    frames: incident.frames,
  });
}

/** Severity is a bounded 0-100 score used for sorting + drift detection. */
export function computeSeverity(input: {
  frequency?: number;
  userCount?: number;
  category?: string;
  confidence?: number;
}): number {
  const freq = Math.log10(Math.max(1, input.frequency ?? 0) + 1) * 15;
  const users = Math.log10(Math.max(1, input.userCount ?? 0) + 1) * 20;
  const catBoost =
    input.category === "security" ? 25
    : input.category === "data-corruption" ? 20
    : input.category === "regression" ? 15
    : input.category === "runtime-crash" ? 10
    : 0;
  const conf = (input.confidence ?? 0) * 10;
  return Math.max(0, Math.min(100, Math.round(freq + users + catBoost + conf)));
}

export interface ClusterDecision {
  isNew: boolean;
  drift: boolean;
  severityJump: boolean;
  shouldAnalyze: boolean;
  shouldSuggestPR: boolean;
}

/**
 * Decide whether AI SRE + PR draft should re-run for an existing cluster.
 * Prevents 20 near-identical issues from generating 20 PRs.
 */
export function decideClusterAction(args: {
  existing: {
    last_analysis_hash: string | null;
    severity_score: number;
  } | null;
  newHash: string;
  newSeverity: number;
  force?: boolean;
}): ClusterDecision {
  const { existing, newHash, newSeverity, force } = args;
  const isNew = !existing;
  const drift = !!existing && existing.last_analysis_hash !== newHash;
  const severityJump = !!existing && newSeverity - existing.severity_score >= 15;
  const shouldAnalyze = !!force || isNew || drift || severityJump;
  return {
    isNew,
    drift,
    severityJump,
    shouldAnalyze,
    // PR draft only on first sighting of a cluster or a real drift — never on repeats.
    shouldSuggestPR: !!force || isNew || drift,
  };
}
