import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { getBriefDir } from "../store/paths.js";
import { computeHash, readStoredHash, writeHash, hasUrgent } from "../store/hash.js";

interface CheckOptions {
  enrichment?: boolean;
}

export async function checkCommand(options: CheckOptions): Promise<void> {
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    process.stdout.write("error: no brief found\n");
    process.exit(3);
  }

  // Enrichment mode: is PRIORITIES.md stale relative to raw/?
  if (options.enrichment) {
    const priFile = join(briefDir, "priorities.md");
    const rawFile = join(briefDir, "priorities-raw.md");

    if (!existsSync(rawFile)) {
      process.stdout.write("stale: no raw data — run brief fetch\n");
      process.exit(5);
    }

    if (!existsSync(priFile)) {
      process.stdout.write("stale: no priorities — build needed\n");
      process.exit(5);
    }

    // Compare raw file mtime vs priorities mtime
    const { statSync } = await import("node:fs");
    const rawMtime = statSync(rawFile).mtimeMs;
    const priMtime = statSync(priFile).mtimeMs;

    if (rawMtime > priMtime) {
      process.stdout.write("stale: raw data newer than priorities\n");
      process.exit(5);
    }

    process.stdout.write("ok: enrichment current\n");
    process.exit(0);
  }

  // Check for missing PRIORITIES-HUMAN.md (interview not done)
  const humanPriFile = join(briefDir, "PRIORITIES-HUMAN.md");
  if (!existsSync(humanPriFile)) {
    process.stdout.write("missing: no PRIORITIES-HUMAN.md — run the interview first (rules/INTERVIEW.md)\n");
    process.exit(6);
  }
  // Check if interview is stale (>7 days)
  const humanContent = readFileSync(humanPriFile, "utf-8");
  if (humanContent.includes("Last reviewed: (not yet)")) {
    process.stdout.write("missing: PRIORITIES-HUMAN.md not filled in — run the interview (rules/INTERVIEW.md)\n");
    process.exit(6);
  }

  // Normal mode: file change detection
  const currentHash = computeHash();
  const storedHash = readStoredHash();

  if (storedHash === null) {
    writeHash(currentHash);
    process.stdout.write("ok\n");
    process.exit(0);
  }

  if (currentHash === storedHash) {
    if (hasUrgent()) {
      process.stdout.write("urgent: priorities\n");
      process.exit(2);
    }
    process.stdout.write("ok\n");
    process.exit(0);
  }

  writeHash(currentHash);

  if (hasUrgent()) {
    process.stdout.write("urgent: priorities\n");
    process.exit(2);
  }

  process.stdout.write("changed: priorities\n");
  process.exit(1);
}
