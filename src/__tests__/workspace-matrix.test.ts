import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { utimesSync } from "node:fs";
import { join } from "node:path";
import {
  cleanupDir,
  createCurrentWorkspace,
  createLegacyWorkspace,
  createMisconfiguredWorkspace,
  fillInterview,
  makeTestDir,
} from "./helpers/workspaces.js";

const CLI = join(process.cwd(), "dist/index.js");

function runExpectingExit(command: string, cwd: string): { status: number; output: string } {
  try {
    const output = execSync(command, { cwd, encoding: "utf-8" });
    return { status: 0, output };
  } catch (error: any) {
    return {
      status: error.status ?? 1,
      output: `${error.stdout || ""}${error.stderr || ""}`,
    };
  }
}

describe("workspace-shape CLI matrix", () => {
  it("covers all health states through the CLI", () => {
    const missingDir = makeTestDir("missing");
    const legacyDir = makeTestDir("legacy");
    const misconfiguredDir = makeTestDir("misconfigured");
    const currentDir = makeTestDir("current");
    const staleDir = makeTestDir("stale");

    try {
      createLegacyWorkspace(legacyDir);
      createMisconfiguredWorkspace(misconfiguredDir);
      createCurrentWorkspace(currentDir);
      createCurrentWorkspace(staleDir, { stale: true });

      const missing = runExpectingExit(`node ${CLI} check --health`, missingDir);
      const legacy = runExpectingExit(`node ${CLI} check --health`, legacyDir);
      const misconfigured = runExpectingExit(`node ${CLI} check --health`, misconfiguredDir);
      const current = runExpectingExit(`node ${CLI} check --health`, currentDir);
      const stale = runExpectingExit(`node ${CLI} check --health`, staleDir);

      expect(missing.status).toBe(3);
      expect(missing.output).toContain("health: missing");

      expect(legacy.status).toBe(6);
      expect(legacy.output).toContain("health: legacy-schema");

      expect(misconfigured.status).toBe(4);
      expect(misconfigured.output).toContain("health: misconfigured");

      expect(current.status).toBe(0);
      expect(current.output).toContain("health: healthy-current-schema");

      expect(stale.status).toBe(5);
      expect(stale.output).toContain("health: stale");
    } finally {
      cleanupDir(missingDir);
      cleanupDir(legacyDir);
      cleanupDir(misconfiguredDir);
      cleanupDir(currentDir);
      cleanupDir(staleDir);
    }
  });

  it("covers health-aware fetch/check behavior across healthy, legacy, and stale workspaces", () => {
    const healthyDir = makeTestDir("healthy-flow");
    const legacyDir = makeTestDir("legacy-flow");
    const staleDir = makeTestDir("stale-flow");

    try {
      execSync(`node ${CLI} init --template startup`, { cwd: healthyDir, encoding: "utf-8" });
      fillInterview(healthyDir);
      createLegacyWorkspace(legacyDir);
      execSync(`node ${CLI} init --template startup`, { cwd: staleDir, encoding: "utf-8" });
      fillInterview(staleDir);

      const healthyFetch = runExpectingExit(`node ${CLI} fetch`, healthyDir);
      const legacyFetch = runExpectingExit(`node ${CLI} fetch`, legacyDir);

      expect(healthyFetch.status).toBe(0);
      expect(healthyFetch.output).toContain("brief check --enrichment");

      expect(legacyFetch.status).toBe(0);
      expect(legacyFetch.output).toContain("health: legacy-schema");
      expect(legacyFetch.output).toContain("legacy context mode");

      const staleOutput = runExpectingExit(`node ${CLI} check --enrichment`, staleDir);
      expect(staleOutput.status).toBe(0);

      // force stale after init/fillInterview
      const staleBrief = join(staleDir, ".brief");
      utimesSync(join(staleBrief, "priorities.md"), new Date("2026-04-08T00:00:00Z"), new Date("2026-04-08T00:00:00Z"));
      utimesSync(join(staleBrief, "priorities-raw.md"), new Date("2026-04-08T01:00:00Z"), new Date("2026-04-08T01:00:00Z"));
      const staleCheck = runExpectingExit(`node ${CLI} check --enrichment`, staleDir);
      expect(staleCheck.status).toBe(5);
      expect(staleCheck.output).toContain("rules/BUILD.md + .brief/raw/");
    } finally {
      cleanupDir(healthyDir);
      cleanupDir(legacyDir);
      cleanupDir(staleDir);
    }
  });
});
