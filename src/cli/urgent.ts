import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir, FILES } from "../store/paths.js";
import { loadConfig } from "../store/config.js";
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
  const config = loadConfig();
  if (config.notify.enabled && config.notify.telegram_bot_token && config.notify.telegram_chat_id) {
    try {
      const { exec } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const execAsync = promisify(exec);
      const text = `⚠️ Brief URGENT: ${message}`;
      await execAsync(
        `curl -s -X POST "https://api.telegram.org/bot${config.notify.telegram_bot_token}/sendMessage" -d chat_id="${config.notify.telegram_chat_id}" -d text="${text.replace(/"/g, '\\"')}"`,
        { timeout: 5000 }
      );
      console.log(chalk.dim("  Telegram notification sent.\n"));
    } catch {
      console.log(chalk.dim("  Telegram notification failed (non-blocking).\n"));
    }
  }
}
