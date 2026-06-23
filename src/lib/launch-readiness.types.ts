export type OverallStatus = "passed" | "failed" | "warning" | "unknown";
export type SchemaValidationStatus = "passed" | "failed" | "unknown";

export type AuditCategoryBreakdown = {
  errors: number;
  warnings: number;
  status: OverallStatus;
};

export type AuditBreakdown = Partial<
  Record<"security" | "accessibility" | "seo" | "performance" | "architecture", AuditCategoryBreakdown>
>;

export type ArtifactUrls = {
  audit?: string;
  playwrightReport?: string;
  securityLogs?: string;
  schemaValidation?: string;
  workflowRun?: string;
};

export type SchemaValidationDetails = {
  missingRoles?: string[];
  extraRoles?: string[];
  missingRoutes?: string[];
  invalidPermissions?: string[];
  timestamp?: string;
};

export type LaunchReadinessRun = {
  id: string;
  commit_sha: string;
  branch: string;
  environment: string;
  workflow_run_id: string | null;
  audit_errors: number;
  audit_warnings: number;
  audit_breakdown: AuditBreakdown;
  playwright_passed: number;
  playwright_failed: number;
  playwright_skipped: number;
  playwright_duration_ms: number;
  security_passed: number;
  security_failed: number;
  schema_validation_status: SchemaValidationStatus;
  schema_validation_details: SchemaValidationDetails;
  overall_status: OverallStatus;
  artifact_urls: ArtifactUrls;
  created_at: string;
};

export type LaunchReadinessIngestPayload = Omit<LaunchReadinessRun, "id" | "created_at">;
