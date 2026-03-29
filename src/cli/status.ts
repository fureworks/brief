import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir } from "../store/paths.js";
import { parseFrontmatter } from "../store/frontmatter.js";
import { loadConfig } from "../store/config.js";

export async function statusCommand(): Promise<void> {
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const config = loadConfig();
  const threshold = config.health.stale_threshold_hours * 3600000;

  console.log("");
  console.log(chalk.bold("  Brief Status"));
  console.log(chalk.dim("  ────────────"));

  function checkDir(dir: string, prefix: string = "") {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith(".")) {
        const filePath = join(dir, entry.name);
        const content = readFileSync(filePath, "utf-8");
        const { frontmatter } = parseFrontmatter(content);

        let ageStr = "unknown";
        let indicator = chalk.dim("?");

        if (frontmatter?.updated) {
          const updated = new Date(frontmatter.updated);
          const age = Date.now() - updated.getTime();
          ageStr = age < 3600000 ? `${Math.round(age / 60000)}m ago` :
                   age < 86400000 ? `${Math.round(age / 3600000)}h ago` :
                   `${Math.round(age / 86400000)}d ago`;
          indicator = age > threshold ? chalk.yellow("⚠️") : chalk.green("✅");
        }

        console.log(`  ${indicator} ${(prefix + entry.name).padEnd(25)} ${chalk.dim(ageStr)}`);
      }
      if (entry.isDirectory()) {
        checkDir(join(dir, entry.name), entry.name + "/");
      }
    }
  }

  checkDir(briefDir);
  console.log("");
}
