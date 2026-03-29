import { join } from "node:path";

export function getBriefDir(base: string = process.cwd()): string {
  return join(base, ".brief");
}

export const FILES = {
  priorities: "priorities.md",
  decisions: "decisions.md",
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
