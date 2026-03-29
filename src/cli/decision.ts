import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir, FILES } from "../store/paths.js";
import { computeHash, writeHash } from "../store/hash.js";

export async function decisionCommand(description: string): Promise<void> {
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const decFile = join(briefDir, FILES.decisions);
  let content = existsSync(decFile) ? readFileSync(decFile, "utf-8") : "";

  const today = new Date().toISOString().split("T")[0];
  const entry = `- **${description}**\n  Source: manual (${new Date().toISOString()})`;

  // Update timestamp
  content = content.replace(/updated: .+/, `updated: ${new Date().toISOString()}`);

  // Find today's section or create it
  if (content.includes(`## ${today}`)) {
    content = content.replace(`## ${today}`, `## ${today}\n${entry}`);
  } else {
    // Add after the first heading
    const headingEnd = content.indexOf("\n# ");
    if (headingEnd > 0) {
      const insertPoint = content.indexOf("\n", headingEnd + 1);
      content = content.slice(0, insertPoint + 1) + `\n## ${today}\n${entry}\n` + content.slice(insertPoint + 1);
    } else {
      content += `\n## ${today}\n${entry}\n`;
    }
  }

  writeFileSync(decFile, content);
  writeHash(computeHash());

  console.log(chalk.green(`  ✓ Decision logged: ${description}\n`));
}
