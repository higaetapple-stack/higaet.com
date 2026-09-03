import { describe, expect, it } from "vitest";
import { insightsSearchSchema } from "@/routes/technologies.insights";
import {
  caseStudiesSearchSchema,
  cleanCaseStudiesSearch,
} from "@/routes/technologies.case-studies";

describe("technologies search state", () => {
  it("insights accepts an empty search without throwing", () => {
    expect(insightsSearchSchema.parse({})).toEqual({});
  });

  it("insights accepts active filters", () => {
    expect(
      insightsSearchSchema.parse({ category: "generative-ai", tag: "rag", q: "evals" }),
    ).toEqual({
      category: "generative-ai",
      tag: "rag",
      q: "evals",
    });
  });

  it("case-studies accepts an empty search without injecting defaults", () => {
    expect(caseStudiesSearchSchema.parse({})).toEqual({});
  });

  it("case-studies coerces a page query string to a number", () => {
    expect(caseStudiesSearchSchema.parse({ page: "2" })).toEqual({ page: 2 });
  });

  it("clean search drops empty strings and page 1", () => {
    expect(
      cleanCaseStudiesSearch({ q: "", category: "", industry: "", service: "", tech: "", page: 1 }),
    ).toEqual({});
  });

  it("clean search keeps only active filters", () => {
    expect(
      cleanCaseStudiesSearch({
        q: "",
        category: "applied-ai",
        industry: "",
        service: "",
        tech: "",
        page: 2,
      }),
    ).toEqual({ category: "applied-ai", page: 2 });
    expect(cleanCaseStudiesSearch({ q: "healthcare" })).toEqual({ q: "healthcare" });
  });
});
