import { existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getBriefDir(base: string = process.cwd()): string {
  return join(base, ".brief");
}

export const FILES = {
  priorities: "priorities.md",
  prioritiesRaw: "priorities-raw.md",
  decisions: "decisions.md",
  decisionsRaw: "decisions-raw.md",
  team: "team.md",
  overrides: "overrides.md",
  agentLog: "agent-log.md",
  hash: ".hash",
  sources: ".sources",
  humanPriorities: "PRIORITIES-HUMAN.md",
} as const;

export const DIRS = {
  state: "state",
  people: "people",
  rules: "rules",
  raw: "raw",
} as const;

export interface BriefSchemaManifest {
  template: "startup";
  requiredDirs: string[];
  seedFiles: string[];
  ruleTemplateFiles: string[];
  requiredFiles: string[];
  requiredPaths: string[];
  currentSchemaMarkers: string[];
  legacySignals: string[];
  legacyMissingMarkers: string[];
}

function getRulesTemplateDir(): string {
  const distPath = join(__dirname, "..", "templates", DIRS.rules);
  if (existsSync(distPath)) return distPath;
  return join(__dirname, "..", "..", "src", "templates", DIRS.rules);
}

export function getRuleTemplateFiles(): string[] {
  const rulesDir = getRulesTemplateDir();
  if (!existsSync(rulesDir)) return [];
  return readdirSync(rulesDir)
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));
}

export function getStartupSchemaManifest(): BriefSchemaManifest {
  const requiredDirs = [DIRS.state, DIRS.people, DIRS.rules, DIRS.raw];
  const seedFiles = [
    FILES.priorities,
    FILES.prioritiesRaw,
    FILES.decisions,
    FILES.decisionsRaw,
    FILES.team,
    FILES.overrides,
    FILES.agentLog,
    FILES.hash,
    FILES.sources,
    FILES.humanPriorities,
  ];
  const ruleTemplateFiles = getRuleTemplateFiles();
  const requiredFiles = [
    ...seedFiles,
    ...ruleTemplateFiles.map((ruleFile) => join(DIRS.rules, ruleFile)),
  ];
  const currentSchemaMarkers = [
    FILES.humanPriorities,
    join(DIRS.rules, "BUILD.md"),
    join(DIRS.rules, "INTERVIEW.md"),
    DIRS.raw,
  ];
  const legacySignals = [
    FILES.priorities,
    FILES.prioritiesRaw,
    FILES.decisions,
    FILES.team,
    FILES.overrides,
    FILES.agentLog,
    DIRS.state,
    DIRS.people,
  ];

  return {
    template: "startup",
    requiredDirs,
    seedFiles,
    ruleTemplateFiles,
    requiredFiles,
    requiredPaths: [...requiredDirs, ...requiredFiles],
    currentSchemaMarkers,
    legacySignals,
    legacyMissingMarkers: currentSchemaMarkers,
  };
}
