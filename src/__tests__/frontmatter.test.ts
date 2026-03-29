import { describe, it, expect } from "vitest";
import { parseFrontmatter, makeFrontmatter, validateFrontmatter } from "../store/frontmatter.js";

describe("frontmatter", () => {
  it("parses valid frontmatter", () => {
    const content = "---\nbrief_version: 1\nupdated: 2026-03-29T14:00:00Z\nsources: [scope, github]\n---\n# Hello";
    const { frontmatter, body } = parseFrontmatter(content);
    expect(frontmatter?.brief_version).toBe(1);
    // js-yaml auto-parses ISO dates into Date objects
    const updated = frontmatter?.updated as unknown;
    const str = updated instanceof Date ? updated.toISOString() : String(updated);
    expect(str).toContain("2026-03-29");
    expect(body.trim()).toBe("# Hello");
  });

  it("returns null frontmatter for content without frontmatter", () => {
    const { frontmatter, body } = parseFrontmatter("# Just a heading");
    expect(frontmatter).toBeNull();
    expect(body).toBe("# Just a heading");
  });

  it("validates missing brief_version", () => {
    const errors = validateFrontmatter({ updated: "2026-03-29" } as any);
    expect(errors).toContain("Missing brief_version (number)");
  });

  it("validates missing updated", () => {
    const errors = validateFrontmatter({ brief_version: 1 } as any);
    expect(errors).toContain("Missing updated (ISO-8601 date)");
  });

  it("validates null frontmatter", () => {
    const errors = validateFrontmatter(null);
    expect(errors).toContain("Missing or invalid YAML frontmatter");
  });

  it("generates valid frontmatter", () => {
    const fm = makeFrontmatter({ brief_version: 1, sources: ["scope"] });
    expect(fm).toContain("brief_version: 1");
    expect(fm).toContain("sources: [scope]");
    expect(fm).toContain("---");
  });
});
