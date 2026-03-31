import { describe, it, expect } from "vitest";
import { rmSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const CLI = join(process.cwd(), "dist/index.js");

function makeTestDir(name: string): string {
  const dir = `/tmp/brief-check-${name}-${Date.now()}`;
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("brief check", () => {
  it("returns exit 0 on no changes", () => {
    const dir = makeTestDir("ok");
    try {
      execSync(`node ${CLI} init --template startup`, { cwd: dir });
      // First check sets hash
      try { execSync(`node ${CLI} check`, { cwd: dir }); } catch {}
      // Second check: no changes
      const result = execSync(`node ${CLI} check`, { cwd: dir, encoding: "utf-8" });
      expect(result.trim()).toBe("ok");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns exit 1 when files changed", () => {
    const dir = makeTestDir("changed");
    try {
      execSync(`node ${CLI} init --template startup`, { cwd: dir });
      // Set baseline
      try { execSync(`node ${CLI} check`, { cwd: dir }); } catch {}
      // Second check sets baseline
      execSync(`node ${CLI} check`, { cwd: dir });
      // Modify file
      const priFile = join(dir, ".brief/priorities.md");
      writeFileSync(priFile, readFileSync(priFile, "utf-8") + "\n- new item");
      // Check detects change
      try {
        execSync(`node ${CLI} check`, { cwd: dir });
        expect.fail("Should have exited with code 1");
      } catch (e: any) {
        expect(e.status).toBe(1);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns exit 2 when urgent flag present", () => {
    const dir = makeTestDir("urgent");
    try {
      execSync(`node ${CLI} init --template startup`, { cwd: dir });
      // Manually add urgent section to priorities.md
      const priFile = join(dir, ".brief/priorities.md");
      writeFileSync(priFile, readFileSync(priFile, "utf-8").replace("# Priorities", "# Priorities\n\n## 🔴 URGENT\n- Test urgent item"));
      // Set baseline then modify to trigger change + urgent
      try { execSync(`node ${CLI} check`, { cwd: dir }); } catch {}
      writeFileSync(priFile, readFileSync(priFile, "utf-8") + "\n- another change");
      try {
        execSync(`node ${CLI} check`, { cwd: dir });
      } catch (e: any) {
        expect(e.status).toBe(2);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns exit 3 when no .brief/ found", () => {
    const dir = makeTestDir("empty");
    try {
      try {
        execSync(`node ${CLI} check`, { cwd: dir });
        expect.fail("Should have exited with code 3");
      } catch (e: any) {
        expect(e.status).toBe(3);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
