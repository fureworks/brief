import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import chalk from "chalk";
import { getBriefDir, FILES } from "../store/paths.js";
import { loadConfig } from "../store/config.js";

const execAsync = promisify(exec);

interface EnrichContextOptions {
  json?: boolean;
}

export async function enrichContextCommand(options: EnrichContextOptions): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const config = loadConfig();
  const enrichment = (config as any).enrichment as {
    context_files?: string[];
    github_repos?: string[];
    github_fields?: string;
    rules?: string;
    owner?: string;
  } | undefined;

  if (!enrichment) {
    console.log(chalk.yellow("  No [enrichment] section in brief.toml.\n"));
    process.exit(1);
  }

  const result: {
    raw_priorities: string;
    context_files: Array<{ path: string; content: string }>;
    github: Array<{ repo: string; items: unknown[] }>;
    rules: string;
    overrides: string;
  } = {
    raw_priorities: "",
    context_files: [],
    github: [],
    rules: enrichment.rules || "",
    overrides: "",
  };

  // Read raw priorities
  const rawFile = join(briefDir, FILES.prioritiesRaw);
  if (existsSync(rawFile)) {
    result.raw_priorities = readFileSync(rawFile, "utf-8");
  }

  // Read overrides
  const overridesFile = join(briefDir, FILES.overrides);
  if (existsSync(overridesFile)) {
    result.overrides = readFileSync(overridesFile, "utf-8");
  }

  // Read context files
  if (enrichment.context_files) {
    for (const filePath of enrichment.context_files) {
      const resolved = filePath.replace(/^~/, process.env.HOME || "");
      if (existsSync(resolved)) {
        result.context_files.push({
          path: filePath,
          content: readFileSync(resolved, "utf-8"),
        });
      }
    }
  }

  // Pull GitHub data
  if (enrichment.github_repos) {
    const fields = enrichment.github_fields || "number,title,reviewDecision,mergeable,labels";
    for (const repo of enrichment.github_repos) {
      try {
        const { stdout } = await execAsync(
          `gh pr list --repo ${repo} --state open --json ${fields} --limit 20`,
          { encoding: "utf-8", timeout: 10000 }
        );
        result.github.push({ repo, items: JSON.parse(stdout) });
      } catch {
        result.github.push({ repo, items: [] });
      }
    }
  }

  // Output
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Structured markdown output
  console.log("# Enrichment Context\n");

  console.log("## Raw Priorities (from brief sync)\n");
  console.log(result.raw_priorities);

  if (result.overrides.trim()) {
    console.log("\n## Overrides\n");
    console.log(result.overrides);
  }

  if (result.context_files.length > 0) {
    console.log("\n## Context Files\n");
    for (const cf of result.context_files) {
      console.log(`### ${cf.path}\n`);
      console.log(cf.content);
      console.log("");
    }
  }

  if (result.github.length > 0) {
    console.log("\n## GitHub PR State\n");
    for (const gh of result.github) {
      console.log(`### ${gh.repo} (${(gh.items as any[]).length} PRs)\n`);
      for (const pr of gh.items as any[]) {
        const decision = pr.reviewDecision || "none";
        const mergeable = pr.mergeable || "unknown";
        const labels = (pr.labels || []).map((l: any) => l.name || l).join(", ");
        console.log(`- #${pr.number} ${pr.title} [${decision}, ${mergeable}]${labels ? ` {${labels}}` : ""}`);
      }
      console.log("");
    }
  }

  if (result.rules) {
    console.log("\n## Enrichment Rules\n");
    console.log(result.rules);
  }

  console.log("\n---");
  console.log("Use this context to rewrite .brief/priorities.md with cross-referenced priorities.");
  console.log("After enrichment, run: brief enrich-done");
}
