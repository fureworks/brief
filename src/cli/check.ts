import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getBriefDir } from "../store/paths.js";
import { computeHash, readStoredHash, writeHash, hasUrgent } from "../store/hash.js";
import { assessBriefHealth, exitCodeForHealth } from "../store/health.js";

interface CheckOptions {
  enrichment?: boolean;
  health?: boolean;
  json?: boolean;
}

function printHealth(options: CheckOptions, health = assessBriefHealth()): never {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(health, null, 2)}\n`);
  } else {
    process.stdout.write(`health: ${health.state}\n`);
    for (const reason of health.reasons) {
      process.stdout.write(`- ${reason}\n`);
    }
  }
  process.exit(exitCodeForHealth(health.state));
}

export async function checkCommand(options: CheckOptions): Promise<void> {
  const briefDir = getBriefDir();
  const health = assessBriefHealth();

  if (options.health) {
    printHealth(options, health);
  }

  if (health.state === "missing" || health.state === "legacy-schema" || health.state === "misconfigured") {
    printHealth(options, health);
  }

  if (!existsSync(briefDir)) {
    process.stdout.write("error: no brief found\n");
    process.exit(3);
  }

  if (options.enrichment) {
    if (health.state === "stale") {
      process.stdout.write(`stale: ${health.reasons.join(" ")}\n`);
      process.exit(5);
    }

    process.stdout.write("ok: enrichment current\n");
    process.exit(0);
  }

  const humanPriFile = join(briefDir, "PRIORITIES-HUMAN.md");
  if (!existsSync(humanPriFile)) {
    process.stdout.write("missing: no PRIORITIES-HUMAN.md — run the interview first (rules/INTERVIEW.md)\n");
    process.exit(6);
  }

  const humanContent = readFileSync(humanPriFile, "utf-8");
  if (humanContent.includes("Last reviewed: (not yet)")) {
    process.stdout.write("missing: PRIORITIES-HUMAN.md not filled in — run the interview (rules/INTERVIEW.md)\n");
    process.exit(6);
  }

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
