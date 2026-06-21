import { describe, it, expect } from "vitest";
import { renderTemplate } from "../template";

describe("renderTemplate", () => {
  it("substitutes flat variables", () => {
    expect(renderTemplate("Hello {{name}}!", { name: "Ada" })).toBe("Hello Ada!");
  });

  it("supports nested keys", () => {
    expect(
      renderTemplate("Hi {{user.name}}", { user: { name: "Grace" } }),
    ).toBe("Hi Grace");
  });

  it("renders missing vars as empty", () => {
    expect(renderTemplate("X{{missing}}Y", {})).toBe("XY");
  });

  it("ignores whitespace inside braces", () => {
    expect(renderTemplate("{{  a  }}", { a: 1 })).toBe("1");
  });

  it("handles empty template", () => {
    expect(renderTemplate("", { a: 1 })).toBe("");
  });
});
