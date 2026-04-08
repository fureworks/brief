import { join } from "node:path";

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

export const RULE_TEMPLATES = [
  "BUILD.md",
  "EVENING.md",
  "FETCH.md",
  "INTERVIEW.md",
  "MORNING.md",
  "SETUP.md",
] as const;

export const CURRENT_SCHEMA = {
  requiredFiles: [
    FILES.priorities,
    FILES.prioritiesRaw,
    FILES.decisions,
    FILES.team,
    FILES.overrides,
    FILES.agentLog,
    FILES.hash,
    FILES.sources,
    FILES.humanPriorities,
    ...RULE_TEMPLATES.map((rule) => join(DIRS.rules, rule)),
  ],
  requiredDirs: [DIRS.state, DIRS.people, DIRS.rules, DIRS.raw],
  legacySignals: [
    FILES.priorities,
    FILES.prioritiesRaw,
    FILES.decisions,
    FILES.team,
    FILES.overrides,
    FILES.agentLog,
    DIRS.state,
    DIRS.people,
  ],
  legacyMissingMarkers: [FILES.humanPriorities, join(DIRS.rules, "BUILD.md"), join(DIRS.rules, "INTERVIEW.md"), DIRS.raw],
} as const;
