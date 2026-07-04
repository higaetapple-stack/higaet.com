import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { KnowledgePackage } from "@/lib/knowledge/types";

// The signing module reads env at call time (via trustedKeys()), so we can
// safely set env vars in-process before importing / invoking it.
const ORIGINAL_ENV = { ...process.env };

beforeAll(() => {
  process.env.KNOWLEDGE_TRUSTED_KEYS = "partner-a:super-secret-a,partner-b:super-secret-b";
  process.env.KNOWLEDGE_SIGNING_SECRET = "local-signing-secret";
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

function basePackage(overrides: Partial<KnowledgePackage> = {}): Omit<KnowledgePackage, "hash" | "signature"> {
  return {
    version: "1.0.0",
    generatedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    categories: [{ category: "rls.drift", frequency: 3, confidence: 0.9 }],
    recommendations: [{ id: "rec-1", effectiveness: 0.8 }],
    calibration: { mae: 0.1, drift: 0.05 },
    ...overrides,
  };
}

describe("knowledge signing", () => {
  it("signs and verifies a package with a trusted key", async () => {
    const { signKnowledgePackage, verifyKnowledgePackage } = await import("../signing.server");
    const signed = await signKnowledgePackage(basePackage(), "partner-a");
    const result = await verifyKnowledgePackage(signed);
    expect(result.valid).toBe(true);
    expect(result.keyId).toBe("partner-a");
  });

  it("rejects a package with an untrusted key id", async () => {
    const { signKnowledgePackage, verifyKnowledgePackage } = await import("../signing.server");
    const signed = await signKnowledgePackage(basePackage(), "partner-a");
    // Tamper: swap keyId to one not in the trusted registry.
    const tampered: KnowledgePackage = { ...signed, signature: `evil-org:${signed.signature!.split(":")[1]}` };
    const result = await verifyKnowledgePackage(tampered);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("untrusted_key");
  });

  it("rejects a package whose payload was mutated after signing (hash mismatch)", async () => {
    const { signKnowledgePackage, verifyKnowledgePackage } = await import("../signing.server");
    const signed = await signKnowledgePackage(basePackage(), "partner-a");
    const tampered: KnowledgePackage = {
      ...signed,
      recommendations: [{ id: "rec-1", effectiveness: 0.99 }],
    };
    const result = await verifyKnowledgePackage(tampered);
    expect(result.valid).toBe(false);
    expect(["hash_mismatch", "signature_mismatch"]).toContain(result.reason);
  });

  it("rejects a package signed with the wrong secret (signature mismatch)", async () => {
    const { signKnowledgePackage, verifyKnowledgePackage } = await import("../signing.server");
    // Sign with partner-a, then flip the keyId to partner-b (a trusted but different secret).
    const signed = await signKnowledgePackage(basePackage(), "partner-a");
    const [, mac] = signed.signature!.split(":");
    const forged: KnowledgePackage = { ...signed, signature: `partner-b:${mac}` };
    const result = await verifyKnowledgePackage(forged);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("signature_mismatch");
  });

  it("rejects an expired package even with a valid signature", async () => {
    const { signKnowledgePackage, verifyKnowledgePackage } = await import("../signing.server");
    const signed = await signKnowledgePackage(
      basePackage({ expiresAt: new Date(Date.now() - 60_000).toISOString() }),
      "partner-a",
    );
    const result = await verifyKnowledgePackage(signed);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("rejects a package with a missing signature", async () => {
    const { verifyKnowledgePackage } = await import("../signing.server");
    const unsigned: KnowledgePackage = { ...basePackage(), hash: "deadbeef" };
    const result = await verifyKnowledgePackage(unsigned);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("missing_signature");
  });
});
