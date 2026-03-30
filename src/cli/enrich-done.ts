import { existsSync } from "node:fs";
import { hostname } from "node:os";
import chalk from "chalk";
import { getBriefDir } from "../store/paths.js";
import { markEnrichmentDone, loadEnrichmentState } from "../store/enrichment.js";
import { loadConfig } from "../store/config.js";

export async function enrichDoneCommand(): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found.\n"));
    process.exit(3);
  }

  // Determine agent name
  const agent = process.env.BRIEF_AGENT_NAME
    || (loadConfig() as any).enrichment?.owner
    || `${process.env.USER || "unknown"}@${hostname()}`;

  // Check ownership
  const existing = loadEnrichmentState();
  if (existing && existing.owner && existing.owner !== agent) {
    console.log(chalk.yellow(`  ⚠ Enrichment owned by ${existing.owner}, not ${agent}. Proceeding anyway.\n`));
  }

  markEnrichmentDone(agent);
  console.log(chalk.green(`  ✓ Enrichment marked complete by ${agent}\n`));
}
