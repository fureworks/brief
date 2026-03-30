#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { initCommand } from "./cli/init.js";
import { validateCommand } from "./cli/validate.js";
import { checkCommand } from "./cli/check.js";
import { readCommand } from "./cli/read.js";
import { statusCommand } from "./cli/status.js";
import { snippetCommand } from "./cli/snippet.js";
import { urgentCommand } from "./cli/urgent.js";
import { syncCommand } from "./cli/sync.js";
import { doctorCommand } from "./cli/doctor.js";
import { assignCommand } from "./cli/assign.js";
import { decisionCommand } from "./cli/decision.js";
import { graphCommand } from "./cli/graph.js";
import { logCommand } from "./cli/log.js";
import { overrideCommand } from "./cli/override.js";
import { migrateCommand } from "./cli/migrate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
  .name("brief")
  .description("Team working memory for AI agents and humans.")
  .version(pkg.version);

program
  .command("init")
  .description("Create .brief/ directory structure")
  .option("--template <name>", "Bootstrap with example content (startup)")
  .option("--no-detect", "Skip detection of existing CLAUDE.md/AGENTS.md")
  .action(initCommand);

program
  .command("validate")
  .description("Check all .brief/ files for frontmatter integrity")
  .action(validateCommand);

program
  .command("check")
  .description("Hash-based change detection (for agents)")
  .action(checkCommand);

program
  .command("read [file]")
  .description("Read a .brief/ file (or list all files)")
  .action(readCommand);

program
  .command("status")
  .description("Show freshness of all .brief/ files")
  .action(statusCommand);

program
  .command("snippet [tool]")
  .description("Generate integration snippet for AI tools (claude, codex, cursor, openclaw)")
  .action(snippetCommand);

program
  .command("sync")
  .description("Pull from configured sources and regenerate .brief/ files")
  .action(syncCommand);

program
  .command("doctor")
  .description("Check source health, stale files, config issues")
  .action(doctorCommand);

program
  .command("assign <person> <item>")
  .description("Assign a person to an item")
  .action(assignCommand);

program
  .command("decision <description>")
  .description("Log a decision manually")
  .action(decisionCommand);

program
  .command("graph [args...]")
  .description("Manage relationships between items (add, query, list)")
  .option("--json", "Output as JSON")
  .action(graphCommand);

program
  .command("log [subcommand] [description]")
  .description("View or write agent action log")
  .option("--json", "Output as JSON")
  .option("--agent <name>", "Agent name")
  .option("--action <action>", "Action taken")
  .option("--reason <reason>", "Why the action was taken")
  .action(logCommand);

program
  .command("override <subcommand> [args...]")
  .description("Manage priority overrides (add, remove, boost, list, clear)")
  .option("--priority <level>", "Priority: now or today")
  .option("--expires <date>", "Expiration date (YYYY-MM-DD)")
  .option("--reason <reason>", "Reason for override")
  .action(overrideCommand);

program
  .command("migrate")
  .description("Migrate .brief/ files to current schema version")
  .action(migrateCommand);

program
  .command("urgent <message>")
  .description("Add urgent item to priorities with optional notification")
  .option("--expires <date>", "Expiration date (YYYY-MM-DD, default: 7 days)")
  .action(urgentCommand);

program.parse();
