import chalk from "chalk";
import { existsSync } from "node:fs";
import { getBriefDir } from "../store/paths.js";
import { loadGraph, saveGraph, queryGraph, GraphLink } from "../store/graph.js";

interface GraphOptions {
  json?: boolean;
}

export async function graphCommand(args: string[], options: GraphOptions): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  // brief graph add <type> <from> <to>
  if (args[0] === "add" && args.length >= 4) {
    const type = args[1] as GraphLink["type"];
    const from = args[2];
    const to = args[3];

    if (!["blocks", "caused_by", "related_to", "supersedes"].includes(type)) {
      console.log(chalk.red(`  Invalid relationship type: ${type}`));
      console.log(chalk.dim("  Valid: blocks, caused_by, related_to, supersedes\n"));
      process.exit(1);
    }

    const links = loadGraph();
    links.push({ from, to, type, added: new Date().toISOString().split("T")[0] });
    saveGraph(links);
    console.log(chalk.green(`  ✓ ${from} ${type} ${to}\n`));
    return;
  }

  // brief graph query <item>
  if (args[0] === "query" && args[1]) {
    const links = loadGraph();
    const related = queryGraph(args[1], links);

    if (options.json) {
      console.log(JSON.stringify(related, null, 2));
      return;
    }

    if (related.length === 0) {
      console.log(chalk.dim(`  No relationships found for ${args[1]}\n`));
      return;
    }

    console.log("");
    console.log(chalk.bold(`  ${args[1]}`));
    console.log(chalk.dim("  " + "─".repeat(args[1].length)));
    for (const link of related) {
      const direction = link.from === args[1] ? `→ ${link.type} → ${link.to}` : `← ${link.type} ← ${link.from}`;
      console.log(`  ${direction} (${chalk.dim(link.added)})`);
    }
    console.log("");
    return;
  }

  // brief graph (show all)
  const links = loadGraph();

  if (options.json) {
    console.log(JSON.stringify(links, null, 2));
    return;
  }

  if (links.length === 0) {
    console.log(chalk.dim("  No relationships found. Use 'brief graph add <type> <from> <to>' to create one.\n"));
    return;
  }

  console.log("");
  console.log(chalk.bold("  Relationships"));
  console.log(chalk.dim("  ─────────────"));
  for (const link of links) {
    console.log(`  ${link.from} ${chalk.dim(link.type)} ${link.to} ${chalk.dim(`(${link.added})`)}`);
  }
  console.log(chalk.dim(`\n  ${links.length} relationship${links.length !== 1 ? "s" : ""}\n`));
}
