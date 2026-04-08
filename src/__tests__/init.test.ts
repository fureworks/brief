import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initCommand } from "../cli/init.js";
import { assessBriefHealth } from "../store/health.js";
import { FILES, getBriefDir, getStartupSchemaManifest } from "../store/paths.js";

describe("brief init", () => {
  const originalCwd = process.cwd();
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "brief-init-"));
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates every required path from the startup schema manifest", async () => {
    await initCommand({ template: "startup" });

    const briefDir = getBriefDir(testDir);
    const manifest = getStartupSchemaManifest();

    for (const relativeDir of manifest.requiredDirs) {
      expect(existsSync(join(briefDir, relativeDir))).toBe(true);
    }

    for (const relativeFile of manifest.requiredFiles) {
      expect(existsSync(join(briefDir, relativeFile))).toBe(true);
    }
  });

  it("creates a workspace that health detection immediately recognizes as current schema", async () => {
    await initCommand({ template: "startup" });

    const report = assessBriefHealth(testDir);
    expect(report.state).toBe("healthy-current-schema");
    expect(report.schema).toBe("current");
  });

  it("seeds the expected startup artifacts", async () => {
    await initCommand({ template: "startup" });

    const briefDir = getBriefDir(testDir);
    const humanPriorities = readFileSync(join(briefDir, FILES.humanPriorities), "utf-8");
    const sources = readFileSync(join(briefDir, FILES.sources), "utf-8");

    expect(humanPriorities).toContain("# Human Priorities");
    expect(sources.trim()).toBe("[]");
  });
});
