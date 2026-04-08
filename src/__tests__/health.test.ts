import { afterEach, describe, expect, it } from "vitest";
import { assessBriefHealth } from "../store/health.js";
import { FILES } from "../store/paths.js";
import {
  cleanupDir,
  createCurrentWorkspace,
  createLegacyWorkspace,
  createMisconfiguredWorkspace,
  makeTestDir,
} from "./helpers/workspaces.js";

describe("assessBriefHealth", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) {
      cleanupDir(dir);
    }
    dirs.length = 0;
  });

  it("detects healthy current schema", () => {
    const dir = makeTestDir("healthy");
    dirs.push(dir);
    createCurrentWorkspace(dir);

    const report = assessBriefHealth(dir);
    expect(report.state).toBe("healthy-current-schema");
    expect(report.schema).toBe("current");
  });

  it("detects stale current schema", () => {
    const dir = makeTestDir("stale");
    dirs.push(dir);
    createCurrentWorkspace(dir, { stale: true });

    const report = assessBriefHealth(dir);
    expect(report.state).toBe("stale");
    expect(report.reasons.some((reason) => reason.includes(FILES.prioritiesRaw))).toBe(true);
  });

  it("detects legacy schema when old core files exist but current markers are missing", () => {
    const dir = makeTestDir("legacy");
    dirs.push(dir);
    createLegacyWorkspace(dir);

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
    createMisconfiguredWorkspace(dir);

    const report = assessBriefHealth(dir);
    expect(report.state).toBe("misconfigured");
  });
});
