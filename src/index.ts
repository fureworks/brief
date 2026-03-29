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
  .command("urgent <message>")
  .description("Add urgent item to priorities with optional notification")
  .option("--expires <date>", "Expiration date (YYYY-MM-DD, default: 7 days)")
  .action(urgentCommand);

program.parse();
