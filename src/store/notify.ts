import chalk from "chalk";
import { loadConfig } from "./config.js";

export async function sendNotification(message: string): Promise<void> {
  const config = loadConfig();

  if (!config.notify.enabled || !config.notify.telegram_bot_token || !config.notify.telegram_chat_id) {
    return;
  }

  try {
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);
    const text = `⚠️ Brief URGENT: ${message}`;
    await execAsync(
      `curl -s -X POST "https://api.telegram.org/bot${config.notify.telegram_bot_token}/sendMessage" -d chat_id="${config.notify.telegram_chat_id}" -d text="${text.replace(/"/g, '\\"')}"`,
      { timeout: 5000 }
    );
    console.log(chalk.dim("  Telegram notification sent."));
  } catch {
    console.log(chalk.dim("  Telegram notification failed (non-blocking)."));
  }
}
