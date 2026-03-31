import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir } from "../store/paths.js";

function readRule(ruleName: string): string | null {
  const briefDir = getBriefDir();
  const rulePath = join(briefDir, "rules", `${ruleName}.md`);
  if (!existsSync(rulePath)) return null;
  return readFileSync(rulePath, "utf-8");
}

function readRawFiles(): string {
  const briefDir = getBriefDir();
  const rawDir = join(briefDir, "raw");
  if (!existsSync(rawDir)) return "(no raw data fetched yet — run 'brief fetch' first)";

  const files: string[] = [];
  for (const entry of readdirSync(rawDir, { withFileTypes: true })) {
    if (entry.isFile()) {
      const content = readFileSync(join(rawDir, entry.name), "utf-8");
      // Truncate large files
      const truncated = content.length > 5000 ? content.slice(0, 5000) + "\n... (truncated)" : content;
      files.push(`### raw/${entry.name}\n\n${truncated}`);
    }
  }
  return files.join("\n\n---\n\n");
}

export async function buildCommand(): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const buildRules = readRule("BUILD");
  if (!buildRules) {
    console.log(chalk.yellow("  No .brief/rules/BUILD.md found. Run 'brief init' to create it.\n"));
    process.exit(1);
  }

  // Output the build prompt for the agent
  console.log("# Brief Build Prompt\n");
  console.log("Follow these rules to build .brief/PRIORITIES.md:\n");
  console.log("---\n");
  console.log(buildRules);
  console.log("\n---\n");
  console.log("## Available Data\n");
  console.log(readRawFiles());

  // Include overrides if present
  const overridesPath = join(briefDir, "OVERRIDES.md");
  if (existsSync(overridesPath)) {
    console.log("\n---\n");
    console.log("## Overrides\n");
    console.log(readFileSync(overridesPath, "utf-8"));
  }

  // Include graph if present
  const graphPath = join(briefDir, "GRAPH.md");
  if (existsSync(graphPath)) {
    console.log("\n---\n");
    console.log("## Relationships\n");
    console.log(readFileSync(graphPath, "utf-8"));
  }

  console.log("\n---\n");
  console.log("After writing PRIORITIES.md, run: `brief enrich-done`");
}

export async function morningCommand(): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const rules = readRule("MORNING");
  if (!rules) {
    console.log(chalk.yellow("  No .brief/rules/MORNING.md found.\n"));
    process.exit(1);
  }

  console.log(rules);
}

export async function eveningCommand(): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const rules = readRule("EVENING");
  if (!rules) {
    console.log(chalk.yellow("  No .brief/rules/EVENING.md found.\n"));
    process.exit(1);
  }

  console.log(rules);
}

export async function interviewCommand(): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const rules = readRule("INTERVIEW");
  if (!rules) {
    console.log(chalk.yellow("  No .brief/rules/INTERVIEW.md found.\n"));
    process.exit(1);
  }

  console.log(rules);
}
