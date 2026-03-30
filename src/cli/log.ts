import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { hostname } from "node:os";
import chalk from "chalk";
import { getBriefDir, FILES } from "../store/paths.js";
import { loadConfig } from "../store/config.js";
import { computeHash } from "../store/hash.js";

interface LogOptions {
  json?: boolean;
  agent?: string;
  action?: string;
  reason?: string;
}

function getAgentName(options: LogOptions): string {
  if (options.agent) return options.agent;
  if (process.env.BRIEF_AGENT_NAME) return process.env.BRIEF_AGENT_NAME;
  const config = loadConfig();
  if ((config as any).agent_name) return (config as any).agent_name;
  return `${process.env.USER || "unknown"}@${hostname()}`;
}

export async function logCommand(subcommand: string | undefined, description: string | undefined, options: LogOptions): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const logFile = join(briefDir, FILES.agentLog);

  // brief log write "description" --agent <name> --action "what was done"
  if (subcommand === "write" && description) {
    const agent = getAgentName(options);
    const hash = computeHash();
    const action = options.action || "unspecified";
    const reason = options.reason || "";
    const timestamp = new Date().toISOString();
    const entry = `- ${timestamp} | ${agent} | ${description} (hash: ${hash.slice(0, 8)}) | ${action}${reason ? ` | Reason: ${reason}` : ""}\n`;

    appendFileSync(logFile, entry);
    console.log(chalk.green(`  ✓ Logged: ${agent} — ${action}\n`));
    return;
  }

  // brief log (view)
  if (!existsSync(logFile)) {
    console.log(chalk.dim("  No agent actions logged yet.\n"));
    return;
  }

  const content = readFileSync(logFile, "utf-8");
  const entries = content.split("\n").filter((l) => l.startsWith("- "));

  if (options.json) {
    const parsed = entries.map((e) => {
      const parts = e.slice(2).split(" | ");
      return { timestamp: parts[0], agent: parts[1], read: parts[2], action: parts[3], reason: parts[4] };
    });
    console.log(JSON.stringify(parsed, null, 2));
    return;
  }

  if (entries.length === 0) {
    console.log(chalk.dim("  No agent actions logged yet.\n"));
    return;
  }

  console.log("");
  console.log(chalk.bold("  Agent Actions"));
  console.log(chalk.dim("  ─────────────"));
  // Show last 20 entries
  const recent = entries.slice(-20);
  for (const entry of recent) {
    const parts = entry.slice(2).split(" | ");
    const time = parts[0]?.slice(11, 19) || "";
    const agent = parts[1] || "";
    const action = parts[3] || "";
    console.log(`  ${chalk.dim(time)} ${agent.padEnd(15)} ${action}`);
  }
  if (entries.length > 20) {
    console.log(chalk.dim(`\n  ... and ${entries.length - 20} more`));
  }
  console.log("");
}
