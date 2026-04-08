import { existsSync, mkdirSync } from "node:fs";
import { getBriefDir, getStartupSchemaManifest } from "../store/paths.js";
import { ensureManifestScaffold } from "../store/scaffold.js";

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
  ensureManifestScaffold(briefDir, manifest, useTemplate ? "startup" : "minimal");

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
