import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir, FILES } from "../store/paths.js";
import { sendNotification } from "../store/notify.js";
import { computeHash, writeHash } from "../store/hash.js";

interface UrgentOptions {
  expires?: string;
}

export async function urgentCommand(message: string, options: UrgentOptions): Promise<void> {
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const priFile = join(briefDir, FILES.priorities);
  let content = existsSync(priFile) ? readFileSync(priFile, "utf-8") : "";

  // Calculate expires date
  const expires = options.expires || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // Build urgent section
  const urgentBlock = [
    "",
    `## 🔴 URGENT`,
    `<!-- expires: ${expires} -->`,
    `- ${message}`,
    `  Source: override (${new Date().toISOString()})`,
    "",
  ].join("\n");

  // Insert after frontmatter, before existing content
  const fmEnd = content.indexOf("---", content.indexOf("---") + 1);
  if (fmEnd > 0) {
    const afterFm = fmEnd + 3;
    content = content.slice(0, afterFm) + "\n" + urgentBlock + content.slice(afterFm);
  } else {
    content = urgentBlock + content;
  }

  // Update the updated timestamp in frontmatter
  content = content.replace(/updated: .+/, `updated: ${new Date().toISOString()}`);

  writeFileSync(priFile, content);
  writeHash(computeHash());

  console.log(chalk.red(`  🔴 URGENT added to priorities.md`));
  console.log(chalk.dim(`  Expires: ${expires}\n`));

  // Send Telegram notification if configured
  await sendNotification(message);
}
