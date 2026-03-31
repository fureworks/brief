#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { initCommand } from "./cli/init.js";
import { validateCommand } from "./cli/validate.js";
import { checkCommand } from "./cli/check.js";
import { readCommand } from "./cli/read.js";
// status merged into doctor
import { snippetCommand } from "./cli/snippet.js";
import { urgentCommand } from "./cli/urgent.js";
// sync replaced by fetch
import { doctorCommand } from "./cli/doctor.js";
import { assignCommand } from "./cli/assign.js";
import { decisionCommand } from "./cli/decision.js";
import { graphCommand } from "./cli/graph.js";
import { logCommand } from "./cli/log.js";
import { overrideCommand } from "./cli/override.js";
import { migrateCommand } from "./cli/migrate.js";
import { serveCommand } from "./cli/serve.js";
import { enrichDoneCommand } from "./cli/enrich-done.js";
import { fetchCommand } from "./cli/fetch.js";
import { buildCommand, morningCommand, eveningCommand, interviewCommand } from "./cli/workflow.js";

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
  .option("--enrichment", "Check if enrichment is stale (exit 5=stale, 0=current)")
  .action(checkCommand);

program
  .command("read [file]")
  .description("Read a .brief/ file (or list all files)")
  .option("--agent <name>", "Filter view for specific agent (from brief.toml [agents.*])")
  .action(readCommand);

// status merged into doctor

program
  .command("snippet [tool]")
  .description("Generate integration snippet for AI tools (claude, codex, cursor, openclaw)")
  .action(snippetCommand);

program
  .command("fetch")
  .description("Fetch data from all configured sources into .brief/raw/")
  .action(fetchCommand);

program
  .command("build")
  .description("Output BUILD.md rules + raw data for agent to build PRIORITIES.md")
  .action(buildCommand);

program
  .command("morning")
  .description("Output morning workflow rules")
  .action(morningCommand);

program
  .command("evening")
  .description("Output evening workflow rules")
  .action(eveningCommand);

program
  .command("interview")
  .description("Output priority interview questions for human review")
  .action(interviewCommand);

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
  .command("enrich-done")
  .description("Mark enrichment as complete (updates staleness tracking)")
  .action(enrichDoneCommand);

program
  .command("serve")
  .description("Start local web viewer for .brief/ files")
  .option("--port <port>", "Port number (default: 3030)")
  .option("--render", "Just generate HTML, don't start server")
  .action(serveCommand);

program
  .command("urgent <message>")
  .description("Add urgent item to priorities with optional notification")
  .option("--expires <date>", "Expiration date (YYYY-MM-DD, default: 7 days)")
  .action(urgentCommand);

program.parse();
