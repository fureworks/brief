import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getBriefDir } from "./paths.js";

export interface GraphLink {
  from: string;
  to: string;
  type: "blocks" | "caused_by" | "related_to" | "supersedes";
  added: string;
}

const GRAPH_FILE = "graph.md";

function getGraphPath(base?: string): string {
  return join(getBriefDir(base), GRAPH_FILE);
}

export function loadGraph(base?: string): GraphLink[] {
  const path = getGraphPath(base);
  if (!existsSync(path)) return [];

  const content = readFileSync(path, "utf-8");
  const links: GraphLink[] = [];

  for (const line of content.split("\n")) {
    const match = line.match(/^- (\S+) (blocks|caused_by|related_to|supersedes) (\S+) \((\d{4}-\d{2}-\d{2})\)/);
    if (match) {
      links.push({ from: match[1], to: match[3], type: match[2] as GraphLink["type"], added: match[4] });
    }
  }

  return links;
}

export function saveGraph(links: GraphLink[], base?: string): void {
  const path = getGraphPath(base);
  const lines = [
    "---",
    "brief_version: 1",
    `updated: ${new Date().toISOString()}`,
    "sources: [manual]",
    "---",
    "",
    "# Relationships",
    "",
  ];
  for (const link of links) {
    lines.push(`- ${link.from} ${link.type} ${link.to} (${link.added})`);
  }
  lines.push("");
  writeFileSync(path, lines.join("\n"));
}

export function queryGraph(itemId: string, links: GraphLink[]): GraphLink[] {
  return links.filter((l) => l.from === itemId || l.to === itemId);
}
