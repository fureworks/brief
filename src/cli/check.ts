import { existsSync } from "node:fs";
import { getBriefDir } from "../store/paths.js";
import { computeHash, readStoredHash, writeHash, hasUrgent } from "../store/hash.js";
import { isEnrichmentStale } from "../store/enrichment.js";

interface CheckOptions {
  enrichment?: boolean;
}

export async function checkCommand(options: CheckOptions): Promise<void> {
  // Enrichment mode: separate exit codes
  if (options.enrichment) {
    const briefDir = getBriefDir();
    if (!existsSync(briefDir)) {
      process.stdout.write("error: no brief found\n");
      process.exit(3);
    }
    if (await isEnrichmentStale()) {
      process.stdout.write("stale: enrichment needs update\n");
      process.exit(5);
    }
    process.stdout.write("ok: enrichment current\n");
    process.exit(0);
  }
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    process.stdout.write("error: no brief found\n");
    process.exit(3);
  }

  const currentHash = computeHash();
  const storedHash = readStoredHash();

  if (storedHash === null) {
    // First check — store current hash
    writeHash(currentHash);
    process.stdout.write("ok\n");
    process.exit(0);
  }

  if (currentHash === storedHash) {
    // Even if hash matches, check for urgent flag
    if (hasUrgent()) {
      process.stdout.write("urgent: priorities\n");
      process.exit(2);
    }
    process.stdout.write("ok\n");
    process.exit(0);
  }

  // Changed — update stored hash
  writeHash(currentHash);

  if (hasUrgent()) {
    process.stdout.write("urgent: priorities\n");
    process.exit(2);
  }

  process.stdout.write("changed: priorities decisions\n");
  process.exit(1);
}
