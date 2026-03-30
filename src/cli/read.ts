import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir } from "../store/paths.js";

interface ReadOptions {
  agent?: string;
}

export async function readCommand(file: string | undefined, options: ReadOptions): Promise<void> {
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

  let content = readFileSync(filePath, "utf-8");

  // Per-agent filtering
  if (options.agent) {
    const config = (await import("../store/config.js")).loadConfig();
    const agents = (config as any).agents as Record<string, { focus?: string[]; hide?: string[] }> | undefined;
    const agentConfig = agents?.[options.agent];

    if (agentConfig) {
      const lines = content.split("\n");
      const filtered: string[] = [];
      let currentSection = "";
      let includeSection = true;

      for (const line of lines) {
        if (line.startsWith("## ")) {
          currentSection = line.toLowerCase();
          const hide = agentConfig.hide || [];
          const focus = agentConfig.focus || [];

          if (hide.length > 0) {
            includeSection = !hide.some((h) => currentSection.includes(h.toLowerCase()));
          } else if (focus.length > 0) {
            includeSection = focus.some((f) => currentSection.includes(f.toLowerCase()));
          } else {
            includeSection = true;
          }
        }

        if (line.startsWith("# ") || line.startsWith("---")) {
          // Always include top-level headings and frontmatter
          filtered.push(line);
        } else if (includeSection) {
          filtered.push(line);
        }
      }

      content = filtered.join("\n");

      if (filtered.filter((l) => l.startsWith("- ")).length === 0) {
        process.stderr.write(`warning: no items matched agent '${options.agent}' focus/hide — showing full file\n`);
        content = readFileSync(filePath, "utf-8");
      }
    }
  }

  process.stdout.write(content);
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
