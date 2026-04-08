import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import chalk from "chalk";
import { getBriefDir } from "../store/paths.js";
import { loadConfig } from "../store/config.js";
import { assessBriefHealth, formatHealthReport } from "../store/health.js";

const execAsync = promisify(exec);

function printHealthBanner(lines: string[], color: "yellow" | "red" = "yellow"): void {
  const tint = color === "red" ? chalk.red : chalk.yellow;
  console.log(tint(`  ${lines[0]}`));
  for (const line of lines.slice(1)) {
    console.log(tint(`  ${line}`));
  }
  console.log("");
}

function printNextSteps(): void {
  console.log(chalk.dim("  Next: run 'brief check --enrichment'."));
  console.log(chalk.dim("  If it reports stale, read .brief/rules/BUILD.md + .brief/raw/ and update .brief/priorities.md yourself.\n"));
}

export async function fetchCommand(): Promise<void> {
  const briefDir = getBriefDir();
  const health = assessBriefHealth();

  if (!existsSync(briefDir)) {
    printHealthBanner([...formatHealthReport(health), "- Run 'brief init --template startup' first."], "red");
    process.exit(3);
  }

  if (health.state === "legacy-schema") {
    printHealthBanner([
      ...formatHealthReport(health),
      "- Continuing in legacy context mode. Do not treat this as full modern Brief steering.",
    ]);
  } else if (health.state === "misconfigured") {
    printHealthBanner([
      ...formatHealthReport(health),
      "- Continuing with best-effort fetch, but the current schema is broken.",
    ]);
  } else if (health.state === "stale") {
    printHealthBanner([
      ...formatHealthReport(health),
      "- Continuing fetch. You will still need to rebuild priorities from rules + raw afterward.",
    ]);
  }

  const rawDir = join(briefDir, "raw");
  mkdirSync(rawDir, { recursive: true });

  const config = loadConfig();
  let fetched = 0;
  let failed = 0;

  console.log(chalk.dim("  Fetching data...\n"));

  for (const source of config.sources) {
    if (source.type === "command" && source.command) {
      try {
        const { stdout } = await execAsync(source.command, {
          timeout: (source.timeout || 15) * 1000,
          encoding: "utf-8",
        });
        const outFile = join(rawDir, `${source.name}.json`);
        writeFileSync(outFile, stdout);
        console.log(chalk.dim(`  ✓ ${source.name} → raw/${source.name}.json`));
        fetched++;
      } catch (e: any) {
        console.log(chalk.yellow(`  ⚠ ${source.name}: ${e.message?.slice(0, 80)}`));
        failed++;
      }
    }

    if (source.type === "directory") {
      try {
        const dirPath = (source.path || "").replace(/^~/, process.env.HOME || "");
        if (!existsSync(dirPath)) {
          console.log(chalk.yellow(`  ⚠ ${source.name}: directory not found`));
          failed++;
          continue;
        }

        const { readdirSync } = await import("node:fs");
        const filesToRead = (source as any).files as string[] | undefined;
        const content: string[] = [];

        if (filesToRead) {
          for (const file of filesToRead) {
            const filePath = join(dirPath, file);
            if (existsSync(filePath)) {
              content.push(`## ${file}\n\n${readFileSync(filePath, "utf-8")}\n`);
            }
          }
        } else {
          for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
            if (entry.isFile() && entry.name.endsWith(".md")) {
              content.push(`## ${entry.name}\n\n${readFileSync(join(dirPath, entry.name), "utf-8")}\n`);
            }
          }
        }

        const outFile = join(rawDir, `${source.name}.md`);
        writeFileSync(outFile, content.join("\n---\n\n"));
        console.log(chalk.dim(`  ✓ ${source.name} → raw/${source.name}.md (${content.length} files)`));
        fetched++;
      } catch (e: any) {
        console.log(chalk.yellow(`  ⚠ ${source.name}: ${e.message?.slice(0, 80)}`));
        failed++;
      }
    }

    if (source.type === "file" && source.path) {
      try {
        const resolved = source.path.replace(/^~/, process.env.HOME || "");
        const content = readFileSync(resolved, "utf-8");
        const outFile = join(rawDir, `${source.name}.md`);
        writeFileSync(outFile, content);
        console.log(chalk.dim(`  ✓ ${source.name} → raw/${source.name}.md`));
        fetched++;
      } catch (e: any) {
        console.log(chalk.yellow(`  ⚠ ${source.name}: ${e.message?.slice(0, 80)}`));
        failed++;
      }
    }
  }

  if (config.hooks?.post_sync) {
    console.log(chalk.dim("\n  Running post-fetch hook..."));
    try {
      const { stdout } = await execAsync(config.hooks.post_sync, {
        timeout: 60000,
        encoding: "utf-8",
      });
      if (stdout.trim()) console.log(chalk.dim(`  ${stdout.trim()}`));
    } catch (e: any) {
      console.log(chalk.yellow(`  ⚠ Hook failed: ${e.message?.slice(0, 80)}`));
    }
  }

  console.log(chalk.green(`\n  ✓ Fetched ${fetched} source${fetched !== 1 ? "s" : ""}${failed > 0 ? chalk.yellow(`, ${failed} failed`) : ""}.\n`));

  const postFetchHealth = assessBriefHealth();
  if (postFetchHealth.state === "legacy-schema") {
    console.log(chalk.yellow("  Next: use the fetched files as context only. This workspace is still legacy-shaped.\n"));
    return;
  }

  if (postFetchHealth.state === "misconfigured") {
    printHealthBanner([
      ...formatHealthReport(postFetchHealth),
      "- Fix the schema before trusting Brief as a steering layer.",
    ]);
    return;
  }

  printNextSteps();
}
