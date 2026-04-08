import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { cleanupDir, createLegacyWorkspace, makeTestDir } from "./helpers/workspaces.js";

const CLI = join(process.cwd(), "dist/index.js");

describe("brief migrate", () => {
  it("shows a deterministic dry-run plan for legacy workspaces", () => {
    const dir = makeTestDir("dry-run");
    try {
      createLegacyWorkspace(dir);
      const output = execSync(`node ${CLI} migrate --dry-run`, { cwd: dir, encoding: "utf-8" });
      expect(output).toContain("migration: legacy-schema -> healthy-current-schema");
      expect(output).toContain("PRIORITIES-HUMAN.md");
      expect(output).toContain("rules/BUILD.md");
      expect(existsSync(join(dir, ".brief", "PRIORITIES-HUMAN.md"))).toBe(false);
    } finally {
      cleanupDir(dir);
    }
  });

  it("applies migration and upgrades legacy workspaces to current schema", () => {
    const dir = makeTestDir("apply");
    try {
      createLegacyWorkspace(dir);
      const output = execSync(`node ${CLI} migrate`, { cwd: dir, encoding: "utf-8" });
      expect(output).toContain("post-migration health: healthy-current-schema");
      expect(existsSync(join(dir, ".brief", "PRIORITIES-HUMAN.md"))).toBe(true);
      expect(existsSync(join(dir, ".brief", "raw"))).toBe(true);

      const health = execSync(`node ${CLI} check --health`, { cwd: dir, encoding: "utf-8" });
      expect(health).toContain("health: healthy-current-schema");
    } finally {
      cleanupDir(dir);
    }
  });

  it("is idempotent after a workspace has been migrated", () => {
    const dir = makeTestDir("idempotent");
    try {
      createLegacyWorkspace(dir);
      execSync(`node ${CLI} migrate`, { cwd: dir, encoding: "utf-8" });
      const output = execSync(`node ${CLI} migrate`, { cwd: dir, encoding: "utf-8" });
      expect(output).toContain("migration: nothing to do (healthy-current-schema)");
    } finally {
      cleanupDir(dir);
    }
  });
});
