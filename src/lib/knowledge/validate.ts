import type { KnowledgePackage, ValidationResult } from "./types";

const SUPPORTED_VERSIONS = new Set(["1.0.0"]);
const MIN_CONFIDENCE = 0.3;

export function validateKnowledgePackage(pkg: KnowledgePackage): ValidationResult {
  const issues: string[] = [];
  if (!SUPPORTED_VERSIONS.has(pkg.version)) issues.push(`Unsupported schema version: ${pkg.version}`);
  if (!pkg.hash) issues.push("Missing integrity hash");
  if (!pkg.generatedAt || !pkg.expiresAt) issues.push("Missing lifecycle timestamps");
  else if (new Date(pkg.expiresAt).getTime() < Date.now()) issues.push("Package expired");

  const lowConf = pkg.categories.filter((c) => c.confidence < MIN_CONFIDENCE);
  if (lowConf.length === pkg.categories.length && pkg.categories.length > 0)
    issues.push("All categories below confidence threshold");

  for (const c of pkg.categories) {
    if (/tenant|customer|user|email|@/.test(c.category))
      issues.push(`Category "${c.category}" appears to contain identifying data`);
  }
  return { valid: issues.length === 0, issues };
}
