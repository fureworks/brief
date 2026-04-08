import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { BriefSchemaManifest } from "./paths.js";
import { DIRS, FILES } from "./paths.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type SeedMode = "startup" | "minimal";

export function getTemplateDir(): string {
  const distPath = join(__dirname, "..", "templates");
  if (existsSync(distPath)) return distPath;
  return join(__dirname, "..", "..", "src", "templates");
}

export function buildSeedContent(relativePath: string, mode: SeedMode, briefDir: string): string {
  switch (relativePath) {
    case FILES.priorities:
      return mode === "startup"
        ? `# Priorities\n\n## Now\n- [ ] Example urgent item\n\n## Next\n- [ ] Example next item\n\n## Waiting\n- [ ] Example blocked item\n`
        : `# Priorities\n\n## Now\n\n## Next\n\n## Waiting\n`;
    case FILES.prioritiesRaw:
      return "# Raw Inputs\n\n<!-- fetched inputs go here -->\n";
    case FILES.decisions:
      return "# Decisions\n\n";
    case FILES.decisionsRaw:
      return "# Decision Inputs\n\n";
    case FILES.team:
      return mode === "startup"
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
      return mode === "startup"
        ? `# Human Priorities\n\nLast reviewed: (not yet)\nReviewer: \n\n## Product Priorities\n- P0: \n- P1: \n- P2: \n\n## Constraints\n- \n\n## This Week\n- \n`
        : "# Human Priorities\n\nLast reviewed: (not yet)\nReviewer: \n";
    default:
      throw new Error(`No seed content defined for ${relativePath}`);
  }
}

export function copyRuleTemplates(briefDir: string, manifest: BriefSchemaManifest): string[] {
  const templateDir = getTemplateDir();
  const rulesSrc = join(templateDir, DIRS.rules);
  const availableRuleFiles = existsSync(rulesSrc)
    ? readdirSync(rulesSrc).filter((file) => file.endsWith(".md"))
    : [];

  const written: string[] = [];
  for (const ruleFile of manifest.ruleTemplateFiles) {
    if (!availableRuleFiles.includes(ruleFile)) continue;
    const src = join(rulesSrc, ruleFile);
    const dest = join(briefDir, DIRS.rules, ruleFile);
    writeFileSync(dest, readFileSync(src, "utf-8"));
    written.push(join(DIRS.rules, ruleFile));
  }
  return written;
}

export function ensureManifestScaffold(
  briefDir: string,
  manifest: BriefSchemaManifest,
  mode: SeedMode
): { dirsCreated: string[]; filesCreated: string[] } {
  const dirsCreated: string[] = [];
  const filesCreated: string[] = [];

  for (const relativeDir of manifest.requiredDirs) {
    const fullPath = join(briefDir, relativeDir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      dirsCreated.push(relativeDir);
    }
  }

  const templateDir = getTemplateDir();
  const rulesSrc = join(templateDir, DIRS.rules);
  const availableRuleFiles = existsSync(rulesSrc)
    ? readdirSync(rulesSrc).filter((file) => file.endsWith(".md"))
    : [];

  for (const ruleFile of manifest.ruleTemplateFiles) {
    const relativePath = join(DIRS.rules, ruleFile);
    const fullPath = join(briefDir, relativePath);
    if (existsSync(fullPath) || !availableRuleFiles.includes(ruleFile)) continue;
    writeFileSync(fullPath, readFileSync(join(rulesSrc, ruleFile), "utf-8"));
    filesCreated.push(relativePath);
  }

  for (const relativeFile of manifest.seedFiles) {
    const fullPath = join(briefDir, relativeFile);
    if (existsSync(fullPath)) continue;
    writeFileSync(fullPath, buildSeedContent(relativeFile, mode, briefDir));
    filesCreated.push(relativeFile);
  }

  return { dirsCreated, filesCreated };
}
