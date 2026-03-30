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
} as const;

export const DIRS = {
  state: "state",
  people: "people",
} as const;
