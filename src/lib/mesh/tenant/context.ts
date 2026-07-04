export type TenantContext = {
  tenantId: string;
  environment: "prod" | "staging" | "dev";
  region: string;
};
