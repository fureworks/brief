import { mkdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FILES, getStartupSchemaManifest } from "../../store/paths.js";

export function makeTestDir(name: string): string {
  const dir = `/tmp/brief-workspace-${name}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function cleanupDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

export function fillInterview(dir: string): void {
  const file = join(dir, ".brief", FILES.humanPriorities);
  writeFileSync(file, "# Human Priorities\n\nLast reviewed: 2026-04-08\nReviewer: test\n\n## Product Priorities\n- P0: Test\n");
}

export function createLegacyWorkspace(dir: string): void {
  const briefDir = join(dir, ".brief");
  mkdirSync(join(briefDir, "state"), { recursive: true });
  mkdirSync(join(briefDir, "people"), { recursive: true });
  writeFileSync(join(briefDir, FILES.priorities), "# Priorities\n");
  writeFileSync(join(briefDir, FILES.prioritiesRaw), "# Raw Inputs\n");
  writeFileSync(join(briefDir, FILES.decisions), "# Decisions\n");
  writeFileSync(join(briefDir, FILES.team), "# Team\n");
  writeFileSync(join(briefDir, FILES.overrides), "# Overrides\n");
  writeFileSync(join(briefDir, FILES.agentLog), "# Agent Log\n");
}

export function createMisconfiguredWorkspace(dir: string): void {
  const briefDir = join(dir, ".brief");
  mkdirSync(join(briefDir, "rules"), { recursive: true });
  writeFileSync(join(briefDir, "rules", "BUILD.md"), "# Build\n");
}

export function createCurrentWorkspace(dir: string, options: { stale?: boolean; reviewedHuman?: boolean } = {}): void {
  const briefDir = join(dir, ".brief");
  const manifest = getStartupSchemaManifest();

  mkdirSync(briefDir, { recursive: true });
  for (const relativeDir of manifest.requiredDirs) {
    mkdirSync(join(briefDir, relativeDir), { recursive: true });
  }

  for (const relativeFile of manifest.requiredFiles) {
    const fullPath = join(briefDir, relativeFile);
    mkdirSync(join(fullPath, ".."), { recursive: true });
    let content = "ok\n";
    if (relativeFile === FILES.humanPriorities) {
      content = options.reviewedHuman === false
        ? "# Human Priorities\n\nLast reviewed: (not yet)\nReviewer: \n"
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
