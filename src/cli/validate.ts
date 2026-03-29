import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir } from "../store/paths.js";
import { parseFrontmatter, validateFrontmatter } from "../store/frontmatter.js";

export async function validateCommand(): Promise<void> {
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  let totalFiles = 0;
  let totalErrors = 0;
  const results: Array<{ file: string; errors: string[] }> = [];

  function checkDir(dir: string, prefix: string = "") {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "overrides.md" && entry.name !== "agent-log.md") {
        totalFiles++;
        const filePath = join(dir, entry.name);
        const content = readFileSync(filePath, "utf-8");
        const { frontmatter } = parseFrontmatter(content);
        const errors = validateFrontmatter(frontmatter);
        if (errors.length > 0) {
          totalErrors += errors.length;
          results.push({ file: prefix + entry.name, errors });
        }
      }
      if (entry.isDirectory()) {
        checkDir(join(dir, entry.name), entry.name + "/");
      }
    }
  }

  checkDir(briefDir);

  console.log("");
  if (totalErrors === 0) {
    console.log(chalk.green(`  ✓ ${totalFiles} file${totalFiles !== 1 ? "s" : ""} validated. No errors.\n`));
  } else {
    for (const { file, errors } of results) {
      console.log(chalk.red(`  ✗ ${file}`));
      for (const err of errors) {
        console.log(chalk.dim(`    ${err}`));
      }
    }
    console.log(chalk.red(`\n  ${totalErrors} error${totalErrors !== 1 ? "s" : ""} in ${results.length} file${results.length !== 1 ? "s" : ""}.\n`));
    process.exit(1);
  }
}
