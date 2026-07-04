/**
 * HMAC-SHA256 signing/verification for cross-org knowledge packages.
 * Server-only — reads KNOWLEDGE_SIGNING_SECRET / KNOWLEDGE_TRUSTED_KEYS.
 *
 * Trusted keys format (env): "orgA:secretA,orgB:secretB"
 */
import type { KnowledgePackage } from "@/lib/knowledge/types";

const enc = new TextEncoder();

function canonicalize(pkg: Omit<KnowledgePackage, "hash" | "signature">): string {
  const ordered = {
    version: pkg.version,
    generatedAt: pkg.generatedAt,
    expiresAt: pkg.expiresAt,
    categories: pkg.categories,
    recommendations: pkg.recommendations,
    calibration: pkg.calibration,
  };
  return JSON.stringify(ordered);
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(data: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(data));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function trustedKeys(): Map<string, string> {
  const raw = process.env.KNOWLEDGE_TRUSTED_KEYS ?? "";
  const map = new Map<string, string>();
  for (const pair of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    const [id, secret] = pair.split(":");
    if (id && secret) map.set(id, secret);
  }
  const local = process.env.KNOWLEDGE_SIGNING_SECRET;
  if (local) map.set("local", local);
  return map;
}

export async function signKnowledgePackage(
  pkg: Omit<KnowledgePackage, "hash" | "signature">,
  keyId = "local",
): Promise<KnowledgePackage> {
  const keys = trustedKeys();
  const secret = keys.get(keyId);
  if (!secret) throw new Error(`Unknown signing key: ${keyId}`);
  const canon = canonicalize(pkg);
  const hash = await sha256(canon);
  const signature = `${keyId}:${await hmac(secret, `${hash}.${canon}`)}`;
  return { ...pkg, hash, signature };
}

export type VerifyResult = {
  valid: boolean;
  keyId?: string;
  reason?: string;
};

export async function verifyKnowledgePackage(pkg: KnowledgePackage): Promise<VerifyResult> {
  if (!pkg.signature) return { valid: false, reason: "missing_signature" };
  const [keyId, mac] = pkg.signature.split(":");
  if (!keyId || !mac) return { valid: false, reason: "malformed_signature" };
  const keys = trustedKeys();
  const secret = keys.get(keyId);
  if (!secret) return { valid: false, keyId, reason: "untrusted_key" };

  const expectedHash = await sha256(canonicalize({ ...pkg, signature: undefined } as KnowledgePackage));
  if (!timingSafeEqual(expectedHash, pkg.hash)) {
    return { valid: false, keyId, reason: "hash_mismatch" };
  }
  const expectedMac = await hmac(secret, canonicalize({ ...pkg, signature: undefined } as KnowledgePackage));
  if (!timingSafeEqual(expectedMac, mac)) {
    return { valid: false, keyId, reason: "signature_mismatch" };
  }
  if (new Date(pkg.expiresAt).getTime() < Date.now()) {
    return { valid: false, keyId, reason: "expired" };
  }
  return { valid: true, keyId };
}
