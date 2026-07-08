import { describe, expect, it } from "vitest";
import {
  aggregateAllCiSignals,
  type GhCheckRun,
  type GhCombinedStatus,
  type GhWorkflowRun,
} from "@/lib/github/client.server";

const check = (name: string, status: string, conclusion: string | null): GhCheckRun => ({
  name,
  status,
  conclusion: conclusion as GhCheckRun["conclusion"],
});
const wf = (name: string, status: string, conclusion: string | null): GhWorkflowRun => ({
  name,
  status,
  conclusion: conclusion as GhWorkflowRun["conclusion"],
  html_url: `https://example.test/${name}`,
  head_sha: "deadbeef",
});
const emptyStatus: GhCombinedStatus = { state: "success", total_count: 0, statuses: [] };

describe("aggregateAllCiSignals", () => {
  it("Case 1: check-run success + workflow success → success", () => {
    const r = aggregateAllCiSignals({
      checkRuns: [check("typecheck", "completed", "success")],
      workflowRuns: [wf("CI Kernel", "completed", "success")],
      combinedStatus: emptyStatus,
    });
    expect(r.verdict).toBe("success");
  });

  it("Case 2: one failed workflow + successful checks → failure", () => {
    const r = aggregateAllCiSignals({
      checkRuns: [check("typecheck", "completed", "success")],
      workflowRuns: [
        wf("CI Kernel", "completed", "success"),
        wf("Parity Gate", "completed", "failure"),
      ],
      combinedStatus: emptyStatus,
    });
    expect(r.verdict).toBe("failure");
    expect(r.reasons.some((x) => x.includes("Parity Gate"))).toBe(true);
  });

  it("Case 3: no signals available → unknown (caller keeps polling)", () => {
    const r = aggregateAllCiSignals({
      checkRuns: [],
      workflowRuns: [],
      combinedStatus: null,
    });
    expect(r.verdict).toBe("unknown");
    expect(r.reasons).toEqual([]);
  });

  it("Case 4: any in-progress check → pending (never permanently blocking)", () => {
    const r = aggregateAllCiSignals({
      checkRuns: [check("typecheck", "in_progress", null)],
      workflowRuns: [wf("CI Kernel", "queued", null)],
      combinedStatus: null,
    });
    expect(r.verdict).toBe("pending");
  });

  it("failure precedence beats pending and success", () => {
    const r = aggregateAllCiSignals({
      checkRuns: [
        check("a", "completed", "success"),
        check("b", "in_progress", null),
        check("c", "completed", "failure"),
      ],
      workflowRuns: [],
      combinedStatus: null,
    });
    expect(r.verdict).toBe("failure");
  });

  it("commit-status failure surfaces as failure", () => {
    const r = aggregateAllCiSignals({
      checkRuns: [],
      workflowRuns: [],
      combinedStatus: {
        state: "failure",
        total_count: 1,
        statuses: [{ context: "ci/parity", state: "failure" }],
      },
    });
    expect(r.verdict).toBe("failure");
    expect(r.reasons.some((x) => x.includes("ci/parity"))).toBe(true);
  });

  it("skipped conclusion counts as success signal", () => {
    const r = aggregateAllCiSignals({
      checkRuns: [check("optional", "completed", "skipped")],
      workflowRuns: [],
      combinedStatus: null,
    });
    expect(r.verdict).toBe("success");
  });
});
