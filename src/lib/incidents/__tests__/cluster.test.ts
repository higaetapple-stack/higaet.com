import { describe, it, expect } from "vitest";
import {
  computeIncidentSignature,
  normalizeMessage,
  pickTopUserFrame,
  computeSeverity,
  decideClusterAction,
} from "../cluster";

describe("normalizeMessage", () => {
  it("strips volatile bits", () => {
    expect(normalizeMessage("failed at id 12345 uuid 550e8400-e29b-41d4-a716-446655440000"))
      .toBe("failed at id <num> uuid <uuid>");
  });
  it("handles null/empty", () => {
    expect(normalizeMessage(null)).toBe("");
    expect(normalizeMessage("")).toBe("");
  });
});

describe("pickTopUserFrame", () => {
  it("prefers app frames over vendor frames", () => {
    const f = pickTopUserFrame([
      { filename: "node_modules/react-dom/index.js", function: "invoke" },
      { filename: "/build/src/routes/x.tsx", function: "handler" },
    ]);
    expect(f.filename).toBe("src/routes/x.tsx");
    expect(f.function).toBe("handler");
  });
});

describe("computeIncidentSignature", () => {
  it("is stable for identical inputs and different for different frames", () => {
    const a = computeIncidentSignature({
      errorType: "TypeError",
      errorValue: "Cannot read property 'x' of undefined",
      frames: [{ filename: "src/foo.ts", function: "bar" }],
    });
    const same = computeIncidentSignature({
      errorType: "TypeError",
      errorValue: "Cannot read property 'x' of undefined",
      frames: [{ filename: "src/foo.ts", function: "bar" }],
    });
    const diff = computeIncidentSignature({
      errorType: "TypeError",
      errorValue: "Cannot read property 'x' of undefined",
      frames: [{ filename: "src/foo.ts", function: "baz" }],
    });
    expect(a).toBe(same);
    expect(a).not.toBe(diff);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
  });
  it("clusters variable messages together", () => {
    const a = computeIncidentSignature({ errorType: "Err", errorValue: "user 12345 not found" });
    const b = computeIncidentSignature({ errorType: "Err", errorValue: "user 67890 not found" });
    expect(a).toBe(b);
  });
});

describe("computeSeverity", () => {
  it("returns 0-100 and boosts security", () => {
    const s = computeSeverity({ frequency: 100, userCount: 50, category: "security", confidence: 0.9 });
    expect(s).toBeGreaterThan(50);
    expect(s).toBeLessThanOrEqual(100);
  });
  it("stays low for empty inputs", () => {
    expect(computeSeverity({})).toBeLessThan(20);
  });
});

describe("decideClusterAction", () => {
  it("new cluster → analyze + suggest PR", () => {
    const d = decideClusterAction({ existing: null, newHash: "h", newSeverity: 20 });
    expect(d.isNew).toBe(true);
    expect(d.shouldAnalyze).toBe(true);
    expect(d.shouldSuggestPR).toBe(true);
  });
  it("repeat with same hash + steady severity → skip", () => {
    const d = decideClusterAction({
      existing: { last_analysis_hash: "h", severity_score: 20 },
      newHash: "h",
      newSeverity: 22,
    });
    expect(d.shouldAnalyze).toBe(false);
    expect(d.shouldSuggestPR).toBe(false);
  });
  it("drift (hash change) → re-analyze + PR", () => {
    const d = decideClusterAction({
      existing: { last_analysis_hash: "old", severity_score: 20 },
      newHash: "new",
      newSeverity: 20,
    });
    expect(d.drift).toBe(true);
    expect(d.shouldAnalyze).toBe(true);
    expect(d.shouldSuggestPR).toBe(true);
  });
  it("severity jump ≥15 → re-analyze (no new PR)", () => {
    const d = decideClusterAction({
      existing: { last_analysis_hash: "h", severity_score: 20 },
      newHash: "h",
      newSeverity: 40,
    });
    expect(d.severityJump).toBe(true);
    expect(d.shouldAnalyze).toBe(true);
    expect(d.shouldSuggestPR).toBe(false);
  });
  it("force overrides everything", () => {
    const d = decideClusterAction({
      existing: { last_analysis_hash: "h", severity_score: 20 },
      newHash: "h",
      newSeverity: 20,
      force: true,
    });
    expect(d.shouldAnalyze).toBe(true);
    expect(d.shouldSuggestPR).toBe(true);
  });
});
