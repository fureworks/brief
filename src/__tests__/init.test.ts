import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const TEST_DIR = "/tmp/brief-test-init";
const CLI = join(process.cwd(), "dist/index.js");

describe("brief init", () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    execSync(`mkdir -p ${TEST_DIR}`);
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("creates .brief/ directory structure", () => {
    execSync(`node ${CLI} init`, { cwd: TEST_DIR });
    expect(existsSync(join(TEST_DIR, ".brief"))).toBe(true);
    expect(existsSync(join(TEST_DIR, ".brief/priorities.md"))).toBe(true);
    expect(existsSync(join(TEST_DIR, ".brief/decisions.md"))).toBe(true);
    expect(existsSync(join(TEST_DIR, ".brief/team.md"))).toBe(true);
    expect(existsSync(join(TEST_DIR, ".brief/overrides.md"))).toBe(true);
    expect(existsSync(join(TEST_DIR, ".brief/agent-log.md"))).toBe(true);
    expect(existsSync(join(TEST_DIR, ".brief/state"))).toBe(true);
    expect(existsSync(join(TEST_DIR, ".brief/people"))).toBe(true);
  });

  it("--template startup adds example content", () => {
    execSync(`node ${CLI} init --template startup`, { cwd: TEST_DIR });
    const priorities = readFileSync(join(TEST_DIR, ".brief/priorities.md"), "utf-8");
    expect(priorities).toContain("## NOW");
    expect(priorities).toContain("## TODAY");
    expect(priorities).toContain("brief_version: 1");
  });

  it("refuses to init if .brief/ already exists", () => {
    execSync(`node ${CLI} init`, { cwd: TEST_DIR });
    const output = execSync(`node ${CLI} init`, { cwd: TEST_DIR, encoding: "utf-8" });
    expect(output).toContain("already exists");
  });
});
