import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir } from "../store/paths.js";
import { parseFrontmatter } from "../store/frontmatter.js";

const CURRENT_VERSION = 1;

export async function migrateCommand(): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  let migrated = 0;
  let upToDate = 0;

  function checkDir(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const filePath = join(dir, entry.name);
        const content = readFileSync(filePath, "utf-8");
        const { frontmatter } = parseFrontmatter(content);

        if (!frontmatter) {
          upToDate++;
          continue;
        }

        if (frontmatter.brief_version < CURRENT_VERSION) {
          // Apply migrations here when we have version 2+
          // For now: just update the version number
          const updated = content.replace(
            `brief_version: ${frontmatter.brief_version}`,
            `brief_version: ${CURRENT_VERSION}`
          );
          writeFileSync(filePath, updated);
          migrated++;
        } else {
          upToDate++;
        }
      }
      if (entry.isDirectory()) {
        checkDir(join(dir, entry.name));
      }
    }
  }

  checkDir(briefDir);

  if (migrated === 0) {
    console.log(chalk.green(`  ✓ All files at version ${CURRENT_VERSION}. Nothing to migrate.\n`));
  } else {
    console.log(chalk.green(`  ✓ Migrated ${migrated} file${migrated !== 1 ? "s" : ""} to version ${CURRENT_VERSION}.\n`));
  }
}
