import { existsSync } from "node:fs";
import { join } from "node:path";
import { assessBriefHealth, formatHealthReport, exitCodeForHealth } from "../store/health.js";
import { getBriefDir, getStartupSchemaManifest } from "../store/paths.js";
import { ensureManifestScaffold } from "../store/scaffold.js";

interface MigrateOptions {
  dryRun?: boolean;
  json?: boolean;
}

interface MigrationPlan {
  from: string;
  to: string;
  briefDir: string;
  detectedLegacySignals: string[];
  createDirs: string[];
  createFiles: string[];
  untouchedFiles: string[];
  postMigrationState?: string;
  manualFollowUp: string[];
}

function buildMigrationPlan(base: string = process.cwd()): MigrationPlan {
  const briefDir = getBriefDir(base);
  const manifest = getStartupSchemaManifest();
  const detectedLegacySignals = manifest.legacySignals.filter((relativePath) => existsSync(join(briefDir, relativePath)));
  const createDirs = manifest.requiredDirs.filter((relativePath) => !existsSync(join(briefDir, relativePath)));
  const createFiles = [
    ...manifest.ruleTemplateFiles
      .map((ruleFile) => join("rules", ruleFile))
      .filter((relativePath) => !existsSync(join(briefDir, relativePath))),
    ...manifest.seedFiles.filter((relativePath) => !existsSync(join(briefDir, relativePath))),
  ];
  const untouchedFiles = manifest.requiredFiles.filter((relativePath) => existsSync(join(briefDir, relativePath)));

  return {
    from: "legacy-schema",
    to: "healthy-current-schema",
    briefDir,
    detectedLegacySignals,
    createDirs,
    createFiles,
    untouchedFiles,
    manualFollowUp: [
      "Review .brief/PRIORITIES-HUMAN.md and fill in real priorities.",
      "Run `brief check --health` after migration.",
      "Run `brief fetch` and then `brief check --enrichment` before trusting priorities.",
    ],
  };
}

function printPlan(plan: MigrationPlan): void {
  console.log(`migration: ${plan.from} -> ${plan.to}`);
  console.log(`path: ${plan.briefDir}`);

  console.log("\nDetected legacy signals:");
  for (const item of plan.detectedLegacySignals) {
    console.log(`- ${item}`);
  }

  console.log("\nCreate directories:");
  if (plan.createDirs.length === 0) {
    console.log("- (none)");
  } else {
    for (const item of plan.createDirs) console.log(`- ${item}`);
  }

  console.log("\nCreate files:");
  if (plan.createFiles.length === 0) {
    console.log("- (none)");
  } else {
    for (const item of plan.createFiles) console.log(`- ${item}`);
  }

  console.log("\nLeave untouched:");
  if (plan.untouchedFiles.length === 0) {
    console.log("- (none)");
  } else {
    for (const item of plan.untouchedFiles) console.log(`- ${item}`);
  }

  console.log("\nManual follow-up:");
  for (const item of plan.manualFollowUp) {
    console.log(`- ${item}`);
  }

  if (plan.postMigrationState) {
    console.log(`\npost-migration health: ${plan.postMigrationState}`);
  }
}

export async function migrateCommand(options: MigrateOptions): Promise<void> {
  const health = assessBriefHealth();

  if (health.state === "missing" || health.state === "misconfigured") {
    for (const line of formatHealthReport(health)) console.log(line);
    process.exit(exitCodeForHealth(health.state));
  }

  if (health.state === "healthy-current-schema" || health.state === "stale") {
    console.log(`migration: nothing to do (${health.state})`);
    process.exit(0);
  }

  const plan = buildMigrationPlan();

  if (options.json) {
    console.log(JSON.stringify(plan, null, 2));
    if (options.dryRun) return;
  }

  if (options.dryRun) {
    printPlan(plan);
    return;
  }

  const manifest = getStartupSchemaManifest();
  ensureManifestScaffold(plan.briefDir, manifest, "minimal");
  const postHealth = assessBriefHealth();
  plan.postMigrationState = postHealth.state;
  printPlan(plan);

  if (postHealth.state !== "healthy-current-schema") {
    for (const line of formatHealthReport(postHealth)) console.log(line);
    process.exit(exitCodeForHealth(postHealth.state));
  }
}
