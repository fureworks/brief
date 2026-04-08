import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CURRENT_SCHEMA, FILES, getBriefDir } from "./paths.js";

export type BriefHealthState =
  | "healthy-current-schema"
  | "legacy-schema"
  | "missing"
  | "misconfigured"
  | "stale";

export interface BriefHealthReport {
  state: BriefHealthState;
  schema: "current" | "legacy" | "missing" | "unknown";
  checkedAt: string;
  reasons: string[];
  missingPaths: string[];
  presentPaths: string[];
  briefDir: string;
}

function existingPaths(baseDir: string, relativePaths: readonly string[]): string[] {
  return relativePaths.filter((relativePath) => existsSync(join(baseDir, relativePath)));
}

function missingPaths(baseDir: string, relativePaths: readonly string[]): string[] {
  return relativePaths.filter((relativePath) => !existsSync(join(baseDir, relativePath)));
}

function staleReasons(briefDir: string): string[] {
  const reasons: string[] = [];
  const prioritiesFile = join(briefDir, FILES.priorities);
  const rawFile = join(briefDir, FILES.prioritiesRaw);
  const humanFile = join(briefDir, FILES.humanPriorities);

  if (!existsSync(rawFile)) {
    reasons.push(`Missing ${FILES.prioritiesRaw}.`);
  }

  if (!existsSync(prioritiesFile)) {
    reasons.push(`Missing ${FILES.priorities}.`);
  }

  if (existsSync(rawFile) && existsSync(prioritiesFile)) {
    const rawMtime = statSync(rawFile).mtimeMs;
    const prioritiesMtime = statSync(prioritiesFile).mtimeMs;
    if (rawMtime > prioritiesMtime) {
      reasons.push(`${FILES.prioritiesRaw} is newer than ${FILES.priorities}.`);
    }
  }

  if (existsSync(humanFile)) {
    const content = readFileSync(humanFile, "utf-8");
    if (content.includes("Last reviewed: (not yet)")) {
      reasons.push(`${FILES.humanPriorities} has not been reviewed yet.`);
    }
  }

  return reasons;
}

export function assessBriefHealth(base: string = process.cwd()): BriefHealthReport {
  const briefDir = getBriefDir(base);
  const checkedAt = new Date().toISOString();

  if (!existsSync(briefDir)) {
    return {
      state: "missing",
      schema: "missing",
      checkedAt,
      reasons: ["No .brief/ directory found."],
      missingPaths: [".brief/"],
      presentPaths: [],
      briefDir,
    };
  }

  const requiredPaths = [...CURRENT_SCHEMA.requiredDirs, ...CURRENT_SCHEMA.requiredFiles];
  const present = existingPaths(briefDir, requiredPaths);
  const missing = missingPaths(briefDir, requiredPaths);

  if (missing.length === 0) {
    const stale = staleReasons(briefDir);
    if (stale.length > 0) {
      return {
        state: "stale",
        schema: "current",
        checkedAt,
        reasons: stale,
        missingPaths: [],
        presentPaths: present,
        briefDir,
      };
    }

    return {
      state: "healthy-current-schema",
      schema: "current",
      checkedAt,
      reasons: ["Current startup schema detected."],
      missingPaths: [],
      presentPaths: present,
      briefDir,
    };
  }

  const legacyPresent = existingPaths(briefDir, CURRENT_SCHEMA.legacySignals);
  const missingCurrentMarkers = missingPaths(briefDir, CURRENT_SCHEMA.legacyMissingMarkers);
  const looksLegacy = legacyPresent.length >= 3 && missingCurrentMarkers.length > 0;

  if (looksLegacy) {
    return {
      state: "legacy-schema",
      schema: "legacy",
      checkedAt,
      reasons: [
        "Legacy brief layout detected.",
        ...missingCurrentMarkers.map((relativePath) => `Missing current-schema marker: ${relativePath}`),
      ],
      missingPaths: missing,
      presentPaths: legacyPresent,
      briefDir,
    };
  }

  return {
    state: "misconfigured",
    schema: "unknown",
    checkedAt,
    reasons: missing.map((relativePath) => `Missing required path: ${relativePath}`),
    missingPaths: missing,
    presentPaths: present,
    briefDir,
  };
}

export function formatHealthReport(report: BriefHealthReport): string[] {
  return [`health: ${report.state}`, ...report.reasons.map((reason) => `- ${reason}`)];
}

export function exitCodeForHealth(state: BriefHealthState): number {
  switch (state) {
    case "healthy-current-schema":
      return 0;
    case "missing":
      return 3;
    case "misconfigured":
      return 4;
    case "stale":
      return 5;
    case "legacy-schema":
      return 6;
  }
}
