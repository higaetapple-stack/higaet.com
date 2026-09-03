import { describe, it, expect } from "vitest";
import { CONTACT_EMAILS, LEAD_RECIPIENTS } from "@/lib/contact";
import { buildLeadNotification } from "@/lib/leads.functions";

const APPROVED: Set<string> = new Set(Object.values(CONTACT_EMAILS));

describe("lead division routing", () => {
  it("routes academy leads to admissions", () => {
    expect(LEAD_RECIPIENTS.academy).toBe("admissions@higaet.com");
  });
  it("routes global-education leads to admissions", () => {
    expect(LEAD_RECIPIENTS.global).toBe("admissions@higaet.com");
  });
  it("routes technologies leads to partnerships", () => {
    expect(LEAD_RECIPIENTS.tech).toBe("partnerships@higaet.com");
  });
  it("routes general leads to hello", () => {
    expect(LEAD_RECIPIENTS.main).toBe("hello@higaet.com");
  });
  it("every recipient is an approved mailbox (no open relay)", () => {
    for (const to of Object.values(LEAD_RECIPIENTS)) {
      expect(APPROVED.has(to)).toBe(true);
    }
  });
  it("notification builder uses only the allowlisted recipient", () => {
    const n = buildLeadNotification({
      name: "A Test",
      email: "lead@example.com",
      phone: "",
      message: "Hello",
      division: "tech",
      source: "technologies_home",
    });
    expect(n.to).toBe("partnerships@higaet.com");
    expect(n.subject).toContain("tech");
    expect(n.subject).toContain("technologies_home");
  });
  it("a malicious source cannot inject an arbitrary recipient", () => {
    const n = buildLeadNotification({
      name: "X",
      email: "x@example.com",
      phone: "",
      message: "hi",
      division: "academy",
      source: "evil@attacker.com",
    });
    expect(n.to).toBe("admissions@higaet.com");
    expect(n.htmlContent).not.toContain('evil@attacker.com"');
  });
  it("escapes HTML in lead content", () => {
    const n = buildLeadNotification({
      name: "<script>alert(1)</script>",
      email: "x@example.com",
      phone: "",
      message: "<b>bold</b>",
      division: "main",
      source: "contact_page",
    });
    expect(n.htmlContent).not.toContain("<script>");
    expect(n.htmlContent).toContain("&lt;script&gt;");
  });
});
