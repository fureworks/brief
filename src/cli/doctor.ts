import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir, FILES } from "../store/paths.js";
import { loadConfig } from "../store/config.js";

export async function doctorCommand(): Promise<void> {
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const config = loadConfig();

  console.log("");
  console.log(chalk.bold("  Brief Doctor"));
  console.log(chalk.dim("  ────────────"));

  // Check config
  const hasConfig = config.sources.length > 0;
  console.log(`  ${hasConfig ? chalk.green("✅") : chalk.yellow("⚠️")} Config: ${hasConfig ? `${config.sources.length} sources configured` : "no sources in brief.toml"}`);

  // Check source health
  const sourcesFile = join(briefDir, FILES.sources);
  if (existsSync(sourcesFile)) {
    const sourcesContent = readFileSync(sourcesFile, "utf-8");
    const lines = sourcesContent.split("\n").filter(Boolean);

    console.log("");
    console.log(chalk.bold("  Sources"));
    console.log(chalk.dim("  ───────"));

    for (const line of lines) {
      const nameMatch = line.match(/^(\w+):/);
      const statusMatch = line.match(/status=(\w+)/);
      const itemsMatch = line.match(/items=(\d+)/);
      const durationMatch = line.match(/duration=(\d+)ms/);
      const errorMatch = line.match(/error="([^"]*)"/);
      const lastMatch = line.match(/last_success=([^\s]+)/);

      const name = nameMatch?.[1] || "unknown";
      const status = statusMatch?.[1] || "unknown";
      const items = itemsMatch?.[1] || "0";
      const duration = durationMatch?.[1] || "?";
      const lastSuccess = lastMatch?.[1] || "";

      let ageStr = "";
      if (lastSuccess) {
        const age = Date.now() - new Date(lastSuccess).getTime();
        ageStr = age < 3600000 ? `${Math.round(age / 60000)}m ago` :
                 age < 86400000 ? `${Math.round(age / 3600000)}h ago` :
                 `${Math.round(age / 86400000)}d ago`;
      }

      const indicator = status === "healthy" ? chalk.green("✅") :
                       status === "error" ? chalk.red("❌") : chalk.yellow("⚠️");

      console.log(`  ${indicator} ${name.padEnd(15)} ${items} items  ${duration}ms  ${chalk.dim(ageStr)}`);
      if (errorMatch) {
        console.log(chalk.red(`     Error: ${errorMatch[1]}`));
      }
    }
  } else {
    console.log(chalk.dim("\n  No sync history. Run 'brief sync' to populate."));
  }

  // Check notifications
  console.log("");
  console.log(chalk.bold("  Notifications"));
  console.log(chalk.dim("  ─────────────"));
  console.log(`  ${config.notify.enabled ? chalk.green("✅ Telegram enabled") : chalk.dim("Disabled (set notify.enabled=true in brief.toml)")}`);

  console.log("");
}
