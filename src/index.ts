#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { initCommand } from "./cli/init.js";
import { fetchCommand } from "./cli/fetch.js";
import { checkCommand } from "./cli/check.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
  .name("brief")
  .description("Team working memory for AI agents and humans.")
  .version(pkg.version);

program
  .command("init")
  .description("Create .brief/ directory with rules templates")
  .option("--template <name>", "Bootstrap with example content (startup)")
  .option("--no-detect", "Skip detection of existing CLAUDE.md/AGENTS.md")
  .action(initCommand);

program
  .command("fetch")
  .description("Fetch data from configured sources into .brief/raw/")
  .action(fetchCommand);

program
  .command("check")
  .description("Change detection and health inspection for automation")
  .option("--enrichment", "Check if enrichment is stale instead of file changes")
  .option("--health", "Inspect brief health/schema state")
  .option("--json", "Output health as JSON (use with --health)")
  .action(checkCommand);

program.parse();
