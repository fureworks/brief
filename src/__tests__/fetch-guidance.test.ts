import { describe, it, expect } from "vitest";
import { mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const CLI = join(process.cwd(), "dist/index.js");

function makeTestDir(name: string): string {
  const dir = `/tmp/brief-fetch-${name}-${Date.now()}`;
  mkdirSync(dir, { recursive: true });
  return dir;
}

function fillInterview(dir: string): void {
  const file = join(dir, ".brief/PRIORITIES-HUMAN.md");
  writeFileSync(file, "# Human Priorities\n\nLast reviewed: 2026-04-08\nReviewer: test\n\n## Product Priorities\n- P0: Test\n");
}

describe("brief fetch/check guidance", () => {
  it("reports missing health state before fetch", () => {
    const dir = makeTestDir("missing");
    try {
      try {
        execSync(`node ${CLI} fetch`, { cwd: dir, encoding: "utf-8" });
        expect.fail("fetch should fail without .brief/");
      } catch (e: any) {
        const output = `${e.stdout || ""}${e.stderr || ""}`;
        expect(e.status).toBe(3);
        expect(output).toContain("health: missing");
        expect(output).toContain("brief init --template startup");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("uses convention-first next steps for healthy schema fetch", () => {
    const dir = makeTestDir("healthy");
    try {
      execSync(`node ${CLI} init --template startup`, { cwd: dir });
      fillInterview(dir);
      const output = execSync(`node ${CLI} fetch`, { cwd: dir, encoding: "utf-8" });
      expect(output).toContain("brief check --enrichment");
      expect(output).toContain("rules/BUILD.md + .brief/raw/");
      expect(output).not.toContain("brief build");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("warns clearly when fetch runs in legacy context mode", () => {
    const dir = makeTestDir("legacy");
    try {
      const briefDir = join(dir, ".brief");
      mkdirSync(join(briefDir, "state"), { recursive: true });
      mkdirSync(join(briefDir, "people"), { recursive: true });
      writeFileSync(join(briefDir, "priorities.md"), "# Priorities\n");
      writeFileSync(join(briefDir, "priorities-raw.md"), "# Raw\n");
      writeFileSync(join(briefDir, "decisions.md"), "# Decisions\n");
      writeFileSync(join(briefDir, "team.md"), "# Team\n");
      writeFileSync(join(briefDir, "overrides.md"), "# Overrides\n");
      writeFileSync(join(briefDir, "agent-log.md"), "# Agent Log\n");
      writeFileSync(join(briefDir, ".hash"), "");
      writeFileSync(join(briefDir, ".sources"), "");

      const output = execSync(`node ${CLI} fetch`, { cwd: dir, encoding: "utf-8" });
      expect(output).toContain("health: legacy-schema");
      expect(output).toContain("legacy context mode");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("gives convention-first stale guidance for enrichment checks", () => {
    const dir = makeTestDir("stale");
    try {
      execSync(`node ${CLI} init --template startup`, { cwd: dir });
      fillInterview(dir);
      const briefDir = join(dir, ".brief");
      const prioritiesFile = join(briefDir, "priorities.md");
      const rawFile = join(briefDir, "priorities-raw.md");
      utimesSync(prioritiesFile, new Date("2026-04-08T00:00:00Z"), new Date("2026-04-08T00:00:00Z"));
      utimesSync(rawFile, new Date("2026-04-08T01:00:00Z"), new Date("2026-04-08T01:00:00Z"));

      try {
        execSync(`node ${CLI} check --enrichment`, { cwd: dir, encoding: "utf-8" });
        expect.fail("check --enrichment should report stale");
      } catch (e: any) {
        const output = `${e.stdout || ""}${e.stderr || ""}`;
        expect(e.status).toBe(5);
        expect(output).toContain("rules/BUILD.md + .brief/raw/");
        expect(output).toContain("update .brief/priorities.md yourself");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
