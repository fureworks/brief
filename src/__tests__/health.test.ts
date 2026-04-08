import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { assessBriefHealth } from "../store/health.js";
import { CURRENT_SCHEMA, FILES } from "../store/paths.js";

function makeTestDir(name: string): string {
  const dir = `/tmp/brief-health-${name}-${Date.now()}`;
  mkdirSync(dir, { recursive: true });
  return dir;
}

function createCurrentSchema(dir: string, options: { stale?: boolean; unreviewedHuman?: boolean } = {}): void {
  const briefDir = join(dir, ".brief");
  mkdirSync(briefDir, { recursive: true });

  for (const relativeDir of CURRENT_SCHEMA.requiredDirs) {
    mkdirSync(join(briefDir, relativeDir), { recursive: true });
  }

  for (const relativeFile of CURRENT_SCHEMA.requiredFiles) {
    const fullPath = join(briefDir, relativeFile);
    mkdirSync(join(fullPath, ".."), { recursive: true });
    let content = "ok\n";
    if (relativeFile === FILES.humanPriorities) {
      content = options.unreviewedHuman
        ? "# Human Priorities\n\nLast reviewed: (not yet)\n"
        : "# Human Priorities\n\nLast reviewed: 2026-04-08\nReviewer: test\n";
    }
    writeFileSync(fullPath, content);
  }

  const prioritiesFile = join(briefDir, FILES.priorities);
  const rawFile = join(briefDir, FILES.prioritiesRaw);
  utimesSync(rawFile, new Date("2026-04-08T00:00:00Z"), new Date("2026-04-08T00:00:00Z"));
  utimesSync(prioritiesFile, new Date("2026-04-08T01:00:00Z"), new Date("2026-04-08T01:00:00Z"));
  if (options.stale) {
    utimesSync(prioritiesFile, new Date("2026-04-08T00:00:00Z"), new Date("2026-04-08T00:00:00Z"));
    utimesSync(rawFile, new Date("2026-04-08T01:00:00Z"), new Date("2026-04-08T01:00:00Z"));
  }
}

describe("assessBriefHealth", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  it("detects healthy current schema", () => {
    const dir = makeTestDir("healthy");
    dirs.push(dir);
    createCurrentSchema(dir);

    const report = assessBriefHealth(dir);
    expect(report.state).toBe("healthy-current-schema");
    expect(report.schema).toBe("current");
  });

  it("detects stale current schema", () => {
    const dir = makeTestDir("stale");
    dirs.push(dir);
    createCurrentSchema(dir, { stale: true });

    const report = assessBriefHealth(dir);
    expect(report.state).toBe("stale");
    expect(report.reasons.some((reason) => reason.includes(FILES.prioritiesRaw))).toBe(true);
  });

  it("detects legacy schema when old core files exist but current markers are missing", () => {
    const dir = makeTestDir("legacy");
    dirs.push(dir);
    const briefDir = join(dir, ".brief");
    mkdirSync(join(briefDir, "state"), { recursive: true });
    mkdirSync(join(briefDir, "people"), { recursive: true });
    writeFileSync(join(briefDir, FILES.priorities), "# Priorities\n");
    writeFileSync(join(briefDir, FILES.prioritiesRaw), "# Raw\n");
    writeFileSync(join(briefDir, FILES.decisions), "# Decisions\n");
    writeFileSync(join(briefDir, FILES.team), "# Team\n");
    writeFileSync(join(briefDir, FILES.overrides), "# Overrides\n");
    writeFileSync(join(briefDir, FILES.agentLog), "# Agent Log\n");

    const report = assessBriefHealth(dir);
    expect(report.state).toBe("legacy-schema");
    expect(report.schema).toBe("legacy");
  });

  it("detects missing brief directories", () => {
    const dir = makeTestDir("missing");
    dirs.push(dir);

    const report = assessBriefHealth(dir);
    expect(report.state).toBe("missing");
  });

  it("detects misconfigured brief directories", () => {
    const dir = makeTestDir("misconfigured");
    dirs.push(dir);
    const briefDir = join(dir, ".brief");
    mkdirSync(join(briefDir, "rules"), { recursive: true });
    writeFileSync(join(briefDir, "rules", "BUILD.md"), "# Build\n");

    const report = assessBriefHealth(dir);
    expect(report.state).toBe("misconfigured");
  });
});
