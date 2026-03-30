import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir, FILES } from "../store/paths.js";
import { computeHash, writeHash } from "../store/hash.js";

interface OverrideOptions {
  priority?: string;
  expires?: string;
  reason?: string;
}

function getOverridesPath(): string {
  return join(getBriefDir(), FILES.overrides);
}

function readOverrides(): string {
  const path = getOverridesPath();
  if (!existsSync(path)) return "# Overrides\n\n## Add\n\n## Remove\n\n## Boost\n";
  return readFileSync(path, "utf-8");
}

function writeOverrides(content: string): void {
  writeFileSync(getOverridesPath(), content);
  writeHash(computeHash());
}

export async function overrideCommand(subcommand: string, args: string[], options: OverrideOptions): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  let content = readOverrides();

  switch (subcommand) {
    case "add": {
      const description = args.join(" ");
      if (!description) { console.log(chalk.red("  Usage: brief override add <description>\n")); process.exit(1); }
      const entry = `- ${description}${options.reason ? `\n  Reason: ${options.reason}` : ""}${options.expires ? `\n  Expires: ${options.expires}` : ""}${options.priority ? `\n  Priority: ${options.priority}` : ""}`;
      if (content.includes("## Add")) {
        content = content.replace("## Add", `## Add\n${entry}`);
      } else {
        content += `\n## Add\n${entry}\n`;
      }
      writeOverrides(content);
      console.log(chalk.green(`  ✓ Override added: ${description}\n`));
      break;
    }

    case "remove": {
      const itemId = args[0];
      if (!itemId) { console.log(chalk.red("  Usage: brief override remove <item-id>\n")); process.exit(1); }
      const entry = `- ${itemId}${options.reason ? `  # ${options.reason}` : ""}`;
      if (content.includes("## Remove")) {
        content = content.replace("## Remove", `## Remove\n${entry}`);
      } else {
        content += `\n## Remove\n${entry}\n`;
      }
      writeOverrides(content);
      console.log(chalk.green(`  ✓ Override: ${itemId} will be suppressed\n`));
      break;
    }

    case "boost": {
      const itemId = args[0];
      if (!itemId) { console.log(chalk.red("  Usage: brief override boost <item-id> --priority now|today\n")); process.exit(1); }
      const priority = options.priority || "now";
      const entry = `- ${itemId}\n  Priority: ${priority}`;
      if (content.includes("## Boost")) {
        content = content.replace("## Boost", `## Boost\n${entry}`);
      } else {
        content += `\n## Boost\n${entry}\n`;
      }
      writeOverrides(content);
      console.log(chalk.green(`  ✓ Override: ${itemId} boosted to ${priority}\n`));
      break;
    }

    case "list": {
      console.log("");
      console.log(chalk.bold("  Overrides"));
      console.log(chalk.dim("  ─────────"));
      const lines = content.split("\n").filter((l) => l.startsWith("- "));
      if (lines.length === 0) {
        console.log(chalk.dim("  (none)"));
      }
      for (const line of lines) {
        console.log(`  ${line}`);
      }
      console.log("");
      break;
    }

    case "clear": {
      const itemId = args[0];
      if (!itemId) { console.log(chalk.red("  Usage: brief override clear <item-id>\n")); process.exit(1); }
      // Remove lines containing this item ID
      const lines = content.split("\n");
      const filtered = lines.filter((l) => !l.includes(itemId));
      writeOverrides(filtered.join("\n"));
      console.log(chalk.green(`  ✓ Cleared override for ${itemId}\n`));
      break;
    }

    default:
      console.log(chalk.red("  Usage: brief override <add|remove|boost|list|clear>\n"));
      process.exit(1);
  }
}
