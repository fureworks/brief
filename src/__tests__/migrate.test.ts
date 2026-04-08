import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CLI = join(process.cwd(), "dist/index.js");

function makeTestDir(name: string): string {
  const dir = `/tmp/brief-migrate-${name}-${Date.now()}`;
  mkdirSync(dir, { recursive: true });
  return dir;
}

function createLegacyWorkspace(dir: string): void {
  const briefDir = join(dir, ".brief");
  mkdirSync(join(briefDir, "state"), { recursive: true });
  mkdirSync(join(briefDir, "people"), { recursive: true });
  writeFileSync(join(briefDir, "priorities.md"), "# Priorities\n");
  writeFileSync(join(briefDir, "priorities-raw.md"), "# Raw Inputs\n");
  writeFileSync(join(briefDir, "decisions.md"), "# Decisions\n");
  writeFileSync(join(briefDir, "team.md"), "# Team\n");
  writeFileSync(join(briefDir, "overrides.md"), "# Overrides\n");
  writeFileSync(join(briefDir, "agent-log.md"), "# Agent Log\n");
}

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
      rmSync(dir, { recursive: true, force: true });
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
      rmSync(dir, { recursive: true, force: true });
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
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
