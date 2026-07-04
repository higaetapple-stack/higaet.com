/**
 * Verifies that every governance admin endpoint refuses non-admin callers.
 *
 * We drive the shared `assertGovernanceAdmin` gate rather than each server
 * function individually — every list, decide, and CSV-export handler is
 * required to call this helper before touching data. If the gate rejects,
 * the handler throws Error("Forbidden") and never returns rows.
 */
import { describe, it, expect } from "vitest";
import { assertGovernanceAdmin } from "@/lib/governance/rbac.server";

function fakeCtx(roleAllowed: boolean, throwError?: string) {
  return {
    userId: "user-1",
    supabase: {
      rpc(_fn: string, _args: unknown) {
        if (throwError) return Promise.resolve({ data: null, error: { message: throwError } });
        return Promise.resolve({ data: roleAllowed, error: null });
      },
    },
  };
}

describe("assertGovernanceAdmin", () => {
  it("passes for admin / super_admin users", async () => {
    await expect(assertGovernanceAdmin(fakeCtx(true))).resolves.toBeUndefined();
  });

  it("throws Forbidden when has_any_role returns false", async () => {
    await expect(assertGovernanceAdmin(fakeCtx(false))).rejects.toThrow("Forbidden");
  });

  it("surfaces the RPC error verbatim so it isn't swallowed silently", async () => {
    await expect(
      assertGovernanceAdmin(fakeCtx(false, "auth.uid() is null")),
    ).rejects.toThrow("auth.uid() is null");
  });
});
