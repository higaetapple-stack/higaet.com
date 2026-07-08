/**
 * Contract tests for /api/public/sre/e2e-trigger.
 *
 * Verifies the endpoint returns HTTP 400 when runSreE2ETest resolves with
 * an invalid or missing `status`, and that the response body carries no
 * pending-warning marker (::warning::). Uses vi.mock to swap the pipeline
 * so the route is exercised in isolation.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const runSreE2ETestMock = vi.fn();

vi.mock("@/lib/sre/pipeline/e2e-test.server", () => ({
  runSreE2ETest: (...args: unknown[]) => runSreE2ETestMock(...args),
}));

vi.mock("@/lib/github/sanitize", () => ({
  sanitizeGithubError: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

const SECRET = "test-secret-value";

async function invoke(): Promise<Response> {
  const mod = await import("../e2e-trigger");
  // TanStack file routes expose handlers under Route.options.server.handlers.
  const route = mod.Route as unknown as {
    options: { server: { handlers: { POST: (ctx: { request: Request }) => Promise<Response> } } };
  };
  const handler = route.options.server.handlers.POST;
  const request = new Request("http://localhost/api/public/sre/e2e-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SECRET}` },
  });
  return handler({ request });
}

describe("e2e-trigger invalid/missing status contract", () => {
  beforeEach(() => {
    vi.resetModules();
    runSreE2ETestMock.mockReset();
    process.env.SRE_E2E_TRIGGER_SECRET = SECRET;
  });

  it("returns HTTP 400 when status is missing", async () => {
    runSreE2ETestMock.mockResolvedValueOnce({ runId: "r1", readyForDeploy: null });
    const res = await invoke();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_status");
    expect(JSON.stringify(body)).not.toContain("::warning::");
  });

  it("returns HTTP 400 for an unknown status value", async () => {
    runSreE2ETestMock.mockResolvedValueOnce({ runId: "r2", status: "bogus", readyForDeploy: null });
    const res = await invoke();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_status");
    expect(body.status).toBe("bogus");
    expect(JSON.stringify(body)).not.toContain("::warning::");
  });

  it("still returns HTTP 200 for passed and 500 for failed (regression guard)", async () => {
    runSreE2ETestMock.mockResolvedValueOnce({ runId: "r3", status: "passed", readyForDeploy: true });
    expect((await invoke()).status).toBe(200);

    runSreE2ETestMock.mockResolvedValueOnce({ runId: "r4", status: "failed", readyForDeploy: false });
    expect((await invoke()).status).toBe(500);

    runSreE2ETestMock.mockResolvedValueOnce({ runId: "r5", status: "pending", readyForDeploy: null });
    expect((await invoke()).status).toBe(200);
  });
});
