import { describe, it, expect } from "vitest";
import { CRM_STATUSES, assignFieldFor, crmEntityTypeSchema } from "@/lib/crm.functions";

describe("generic lead CRM model", () => {
  it("accepts the generic_lead entity type", () => {
    expect(crmEntityTypeSchema.parse("generic_lead")).toBe("generic_lead");
  });
  it("keeps all existing entity types valid", () => {
    for (const t of [
      "study_abroad_lead",
      "tech_lead",
      "application",
      "job_application",
      "placement",
    ]) {
      expect(crmEntityTypeSchema.parse(t)).toBe(t);
    }
  });
  it("rejects unknown entity types", () => {
    expect(crmEntityTypeSchema.safeParse("press_release").success).toBe(false);
    expect(crmEntityTypeSchema.safeParse("leads").success).toBe(false);
  });
  it("uses the established 6-stage status model", () => {
    expect([...CRM_STATUSES]).toEqual([
      "new",
      "contacted",
      "qualified",
      "in_progress",
      "converted",
      "closed",
    ]);
  });
  it("rejects arbitrary status strings", () => {
    const schema = crmEntityTypeSchema;
    expect(schema.safeParse("archived").success).toBe(false);
    const status = (s: string) => (CRM_STATUSES as readonly string[]).includes(s);
    expect(status("new")).toBe(true);
    expect(status("archived")).toBe(false);
    expect(status("")).toBe(false);
    expect(status("NEW")).toBe(false);
  });
  it("maps assignment columns per entity", () => {
    expect(assignFieldFor("generic_lead")).toBe("assigned_to");
    expect(assignFieldFor("tech_lead")).toBe("assigned_to");
    expect(assignFieldFor("study_abroad_lead")).toBe("assigned_to_counselor");
    expect(assignFieldFor("application")).toBe("assigned_to_counselor");
  });
});
