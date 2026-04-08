import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getBriefDir } from "../store/paths.js";
import { computeHash, readStoredHash, writeHash, hasUrgent } from "../store/hash.js";
import { assessBriefHealth, exitCodeForHealth, formatHealthReport } from "../store/health.js";

interface CheckOptions {
  enrichment?: boolean;
  health?: boolean;
  json?: boolean;
}

function outputHealth(options: CheckOptions, lines: string[], exitCode: number): never {
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ lines }, null, 2)}\n`);
  } else {
    process.stdout.write(`${lines.join("\n")}\n`);
  }
  process.exit(exitCode);
}

function printHealth(options: CheckOptions, nextSteps: string[] = []): never {
  const health = assessBriefHealth();
  if (options.json) {
    process.stdout.write(`${JSON.stringify(health, null, 2)}\n`);
    process.exit(exitCodeForHealth(health.state));
  }

  const lines = [...formatHealthReport(health), ...nextSteps.map((step) => `- ${step}`)];
  outputHealth(options, lines, exitCodeForHealth(health.state));
}

export async function checkCommand(options: CheckOptions): Promise<void> {
  const briefDir = getBriefDir();
  const health = assessBriefHealth();

  if (options.health) {
    const nextSteps: string[] = [];
    if (health.state === "missing") {
      nextSteps.push("Run 'brief init --template startup'.");
    }
    if (health.state === "legacy-schema") {
      nextSteps.push("Legacy context can still be fetched, but do not treat this as full modern Brief steering.");
    }
    if (health.state === "misconfigured") {
      nextSteps.push("Fix the missing paths before trusting Brief.");
    }
    if (health.state === "stale") {
      nextSteps.push("Read .brief/rules/BUILD.md + .brief/raw/ and update .brief/priorities.md yourself.");
    }
    const lines = [...formatHealthReport(health), ...nextSteps.map((step) => `- ${step}`)];
    outputHealth(options, lines, exitCodeForHealth(health.state));
  }

  if (health.state === "missing") {
    outputHealth(options, [...formatHealthReport(health), "- Run 'brief init --template startup'."], exitCodeForHealth(health.state));
  }

  if (health.state === "legacy-schema") {
    outputHealth(
      options,
      [
        ...formatHealthReport(health),
        "- Legacy context is available, but current-schema rules are missing.",
        "- Do not treat this as full modern Brief steering.",
      ],
      exitCodeForHealth(health.state)
    );
  }

  if (health.state === "misconfigured") {
    outputHealth(
      options,
      [...formatHealthReport(health), "- Fix the missing paths before trusting Brief."],
      exitCodeForHealth(health.state)
    );
  }

  if (!existsSync(briefDir)) {
    process.stdout.write("error: no brief found\n");
    process.exit(3);
  }

  if (options.enrichment) {
    if (health.state === "stale") {
      process.stdout.write(
        `stale: ${health.reasons.join(" ")} Read .brief/rules/BUILD.md + .brief/raw/ and update .brief/priorities.md yourself.\n`
      );
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
