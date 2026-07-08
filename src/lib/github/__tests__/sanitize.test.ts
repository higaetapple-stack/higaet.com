import { describe, expect, it } from "vitest";
import { sanitizeGithubError } from "@/lib/github/sanitize";

describe("sanitizeGithubError", () => {
  it("keeps a normal GitHub error intact", () => {
    const msg = "github 403 /repos/x/y/check-runs: Resource not accessible";
    expect(sanitizeGithubError(new Error(msg))).toBe(msg);
  });

  it("removes ghp_ / github_pat_ / bearer tokens", () => {
    const s = sanitizeGithubError(
      "auth failed with ghp_ABCDEFGHIJKLMNOPQRSTUV0123456789 and Bearer eyJhbGciOi.payload.sig and github_pat_11ABCDEFGHIJKLMNOPQRSTUV_extra",
    );
    expect(s).not.toMatch(/ghp_/);
    expect(s).not.toMatch(/github_pat_/);
    expect(s).not.toMatch(/Bearer eyJ/);
    expect(s).toContain("[redacted");
  });

  it("removes JWT-like triplets", () => {
    const jwt = "aaaaaaaaaaaa.bbbbbbbbbbbb.cccccccccccc";
    const out = sanitizeGithubError(`error: token=${jwt}`);
    expect(out).not.toContain(jwt);
    expect(out).toContain("[redacted-jwt]");
  });

  it("strips inline authorization headers", () => {
    const out = sanitizeGithubError("fetch failed authorization: Bearer secretvalue");
    expect(out.toLowerCase()).not.toContain("secretvalue");
  });

  it("truncates at 400 chars", () => {
    const long = "x".repeat(1000);
    const out = sanitizeGithubError(long);
    expect(out.length).toBeLessThanOrEqual(400);
    expect(out.endsWith("…")).toBe(true);
  });

  it("handles non-Error input", () => {
    expect(sanitizeGithubError({ status: 500, body: "boom" })).toContain("boom");
    expect(sanitizeGithubError(null)).toBe("null");
  });
});
