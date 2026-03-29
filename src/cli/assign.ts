import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { getBriefDir, DIRS } from "../store/paths.js";
import { makeFrontmatter } from "../store/frontmatter.js";
import { computeHash, writeHash } from "../store/hash.js";

export async function assignCommand(person: string, item: string): Promise<void> {
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const peopleDir = join(briefDir, DIRS.people);
  mkdirSync(peopleDir, { recursive: true });

  const personFile = join(peopleDir, `${person.toLowerCase()}.md`);
  let content: string;

  if (existsSync(personFile)) {
    content = readFileSync(personFile, "utf-8");
    // Update the updated timestamp
    content = content.replace(/updated: .+/, `updated: ${new Date().toISOString()}`);
    // Append to assigned section
    if (content.includes("## Assigned")) {
      content = content.replace("## Assigned", `## Assigned\n- ${item} (assigned ${new Date().toISOString().split("T")[0]})`);
    } else {
      content += `\n## Assigned\n- ${item} (assigned ${new Date().toISOString().split("T")[0]})\n`;
    }
  } else {
    const fm = makeFrontmatter();
    content = fm + `# ${person.charAt(0).toUpperCase() + person.slice(1)}\n\n## Current Focus\n- ${item}\n\n## Assigned\n- ${item} (assigned ${new Date().toISOString().split("T")[0]})\n`;
  }

  writeFileSync(personFile, content);
  writeHash(computeHash());

  console.log(chalk.green(`  ✓ Assigned ${item} to ${person}\n`));
}
