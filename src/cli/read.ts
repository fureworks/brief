import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir } from "../store/paths.js";

export async function readCommand(file?: string): Promise<void> {
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  if (!file) {
    // List all files with timestamps
    console.log("");
    console.log(chalk.bold("  Brief files"));
    console.log(chalk.dim("  ──────────"));
    listDir(briefDir, "");
    console.log("");
    return;
  }

  // Resolve shorthand: "priorities" → "priorities.md"
  let filePath = join(briefDir, file);
  if (!filePath.endsWith(".md")) filePath += ".md";

  if (!existsSync(filePath)) {
    // Check subdirectories
    for (const sub of ["state", "people"]) {
      const subPath = join(briefDir, sub, file.endsWith(".md") ? file : file + ".md");
      if (existsSync(subPath)) {
        filePath = subPath;
        break;
      }
    }
  }

  if (!existsSync(filePath)) {
    console.log(chalk.red(`  File not found: ${file}\n`));
    process.exit(1);
  }

  process.stdout.write(readFileSync(filePath, "utf-8"));
}

function listDir(dir: string, prefix: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const fullPath = join(dir, entry.name);
      const stat = statSync(fullPath);
      const age = Date.now() - stat.mtimeMs;
      const ageStr = age < 3600000 ? `${Math.round(age / 60000)}m ago` :
                     age < 86400000 ? `${Math.round(age / 3600000)}h ago` :
                     `${Math.round(age / 86400000)}d ago`;
      console.log(`  ${prefix}${entry.name.padEnd(20)} ${chalk.dim(ageStr)}`);
    }
    if (entry.isDirectory()) {
      listDir(join(dir, entry.name), entry.name + "/");
    }
  }
}
