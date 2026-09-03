import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PROGRAMS, CAMPUSES, getCampus } from "@/lib/academy-programs";

const ROUTES = (...segs: string[]) => path.resolve(process.cwd(), "src", ...segs);

describe("academy mega menu destinations", () => {
  it("every program has a slug, title, and category with unique slugs", () => {
    expect(PROGRAMS.length).toBeGreaterThan(0);
    const slugs = new Set<string>();
    for (const p of PROGRAMS) {
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(slugs.has(p.slug)).toBe(false);
      slugs.add(p.slug);
    }
  });

  it("program detail + listing routes exist", () => {
    expect(fs.existsSync(ROUTES("routes", "academy.programs.index.tsx"))).toBe(true);
    expect(fs.existsSync(ROUTES("routes", "academy.programs.$slug.tsx"))).toBe(true);
  });

  it("campuses include Bengaluru and Hyderabad and resolve", () => {
    const slugs = CAMPUSES.map((c) => c.slug);
    expect(slugs).toContain("higaet-bengaluru");
    expect(slugs).toContain("higaet-hyderabad");
    expect(getCampus("higaet-bengaluru")?.name).toContain("Bengaluru");
    expect(getCampus("higaet-hyderabad")?.name).toContain("Hyderabad");
  });

  it("campus listing + detail routes exist", () => {
    expect(fs.existsSync(ROUTES("routes", "academy.campuses.index.tsx"))).toBe(true);
    expect(fs.existsSync(ROUTES("routes", "academy.campuses.$slug.tsx"))).toBe(true);
  });

  it("resource destination routes exist", () => {
    for (const f of [
      "academy.learning-paths.tsx",
      "academy.placements.tsx",
      "academy.scholarship.tsx",
      "academy.corporate-training.tsx",
      "academy.success-stories.tsx",
      "academy.certifications.tsx",
      "academy.internships.tsx",
      "academy.admissions.tsx",
      "academy.faq.tsx",
      "academy.contact.tsx",
    ]) {
      expect(fs.existsSync(ROUTES("routes", f)), f).toBe(true);
    }
  });
});
