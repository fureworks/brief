import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getBriefDir, getStartupSchemaManifest, DIRS, FILES } from "../store/paths.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getTemplateDir(): string {
  const distPath = join(__dirname, "..", "templates");
  if (existsSync(distPath)) return distPath;
  return join(__dirname, "..", "..", "src", "templates");
}

function buildSeedContent(relativePath: string, useTemplate: boolean, briefDir: string): string {
  switch (relativePath) {
    case FILES.priorities:
      return useTemplate
        ? `# Priorities\n\n## Now\n- [ ] Example urgent item\n\n## Next\n- [ ] Example next item\n\n## Waiting\n- [ ] Example blocked item\n`
        : `# Priorities\n\n## Now\n\n## Next\n\n## Waiting\n`;
    case FILES.prioritiesRaw:
      return "# Raw Inputs\n\n<!-- fetched inputs go here -->\n";
    case FILES.decisions:
      return "# Decisions\n\n";
    case FILES.decisionsRaw:
      return "# Decision Inputs\n\n";
    case FILES.team:
      return useTemplate
        ? `# Team\n\n## Roles\n- Founder: you\n- Agent: Brief-compatible AI\n`
        : "# Team\n\n";
    case FILES.overrides:
      return "# Overrides\n\n";
    case FILES.agentLog:
      return "# Agent Log\n\n";
    case FILES.hash:
      return "";
    case FILES.sources:
      return existsSync(join(briefDir, FILES.sources)) ? readFileSync(join(briefDir, FILES.sources), "utf-8") : "[]\n";
    case FILES.humanPriorities:
      return useTemplate
        ? `# Human Priorities\n\nLast reviewed: (not yet)\nReviewer: \n\n## Product Priorities\n- P0: \n- P1: \n- P2: \n\n## Constraints\n- \n\n## This Week\n- \n`
        : "# Human Priorities\n\nLast reviewed: (not yet)\nReviewer: \n";
    default:
      throw new Error(`No seed content defined for ${relativePath}`);
  }
}

interface InitOptions {
  template?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const briefDir = getBriefDir();
  const useTemplate = options.template === "startup";
  const manifest = getStartupSchemaManifest();

  if (existsSync(briefDir)) {
    console.log("Brief already exists here.");
    console.log(`Path: ${briefDir}`);
    console.log("Run `brief check --health` to inspect the current workspace state.");
    return;
  }

  mkdirSync(briefDir, { recursive: true });
  for (const relativeDir of manifest.requiredDirs) {
    mkdirSync(join(briefDir, relativeDir), { recursive: true });
  }

  const templateDir = getTemplateDir();
  const rulesSrc = join(templateDir, DIRS.rules);
  const availableRuleFiles = existsSync(rulesSrc)
    ? readdirSync(rulesSrc).filter((file) => file.endsWith(".md"))
    : [];

  for (const ruleFile of manifest.ruleTemplateFiles) {
    const src = join(rulesSrc, ruleFile);
    const dest = join(briefDir, DIRS.rules, ruleFile);
    if (availableRuleFiles.includes(ruleFile)) {
      writeFileSync(dest, readFileSync(src, "utf-8"));
    }
  }

  for (const relativeFile of manifest.seedFiles) {
    const fullPath = join(briefDir, relativeFile);
    writeFileSync(fullPath, buildSeedContent(relativeFile, useTemplate, briefDir));
  }

  console.log(`Initialized Brief in ${briefDir}`);

  if (useTemplate) {
    console.log("\nStartup template created:");
    console.log("- Human priorities interview scaffold");
    console.log("- Rules directory with build/fetch/interview/morning/evening guides");
    console.log("- Raw/ state/ people/ directories");
  }

  console.log("\nNext steps:");
  console.log("1. Fill in .brief/PRIORITIES-HUMAN.md");
  console.log("2. Configure sources in .brief/.sources");
  console.log("3. Run `brief check --health`");
  console.log("4. Run `brief fetch`");
}
