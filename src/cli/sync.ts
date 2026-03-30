import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import chalk from "chalk";
import { getBriefDir, FILES, DIRS } from "../store/paths.js";
import { loadConfig, BriefConfig } from "../store/config.js";
import { makeFrontmatter } from "../store/frontmatter.js";
import { computeHash, writeHash } from "../store/hash.js";

const execAsync = promisify(exec);

interface SourceResult {
  name: string;
  target: string;
  items: unknown[];
  error?: string;
  duration: number;
}

async function runSource(source: BriefConfig["sources"][0]): Promise<SourceResult> {
  const start = Date.now();

  if (source.type === "file") {
    try {
      const content = readFileSync(source.path || "", "utf-8");
      return { name: source.name, target: source.target, items: [{ raw: content }], duration: Date.now() - start };
    } catch (e: any) {
      return { name: source.name, target: source.target, items: [], error: e.message, duration: Date.now() - start };
    }
  }

  if (source.type === "command" && source.command) {
    try {
      const { stdout } = await execAsync(source.command, {
        timeout: (source.timeout || 15) * 1000,
        encoding: "utf-8",
      });
      const parsed = JSON.parse(stdout);
      let items = Array.isArray(parsed) ? parsed : parsed.now ? [...(parsed.now || []), ...(parsed.today || [])] : [parsed];

      // Apply field mapping if configured
      if (source.mapping) {
        items = items.map((item: Record<string, unknown>) => {
          const mapped: Record<string, unknown> = { ...item };
          for (const [briefField, sourceField] of Object.entries(source.mapping!)) {
            if (item[sourceField] !== undefined) {
              mapped[briefField] = item[sourceField];
            }
          }
          return mapped;
        });
      }

      return { name: source.name, target: source.target, items, duration: Date.now() - start };
    } catch (e: any) {
      return { name: source.name, target: source.target, items: [], error: e.message?.slice(0, 100), duration: Date.now() - start };
    }
  }

  return { name: source.name, target: source.target, items: [], error: "Unknown source type", duration: 0 };
}

function renderPriorities(results: SourceResult[], config: BriefConfig): string {
  const fm = makeFrontmatter({ sources: results.map((r) => r.name) });
  const lines: string[] = [fm, "# Priorities", ""];

  // Read overrides
  const briefDir = getBriefDir();
  const overridesPath = join(briefDir, FILES.overrides);
  let overrideContent = "";
  if (existsSync(overridesPath)) {
    overrideContent = readFileSync(overridesPath, "utf-8");
  }

  // Check for urgent in overrides
  const urgentMatch = overrideContent.match(/## Add\n([\s\S]*?)(?=\n##|$)/);
  if (urgentMatch) {
    const addItems = urgentMatch[1].trim();
    if (addItems && !addItems.startsWith("#")) {
      lines.push("## 🔴 OVERRIDE", addItems, "");
    }
  }

  // Collect items from all priority-targeted sources, sorted by source priority
  const priorityResults = results
    .filter((r) => r.target === "priorities" && r.items.length > 0)
    .sort((a, b) => {
      const aPri = config.sources.find((s) => s.name === a.name)?.priority || 0;
      const bPri = config.sources.find((s) => s.name === b.name)?.priority || 0;
      return bPri - aPri;
    });

  const nowItems: string[] = [];
  const todayItems: string[] = [];
  let ignoredCount = 0;

  for (const result of priorityResults) {
    for (const item of result.items) {
      const i = item as Record<string, unknown>;
      if (i.priority === "now" || i.priority === "NOW") {
        const label = i.label || i.title || i.id || "Unknown";
        const detail = i.detail || i.description || "";
        const reason = i.reason || "";
        const status = i.status || "active";
        if (status === "completed") { ignoredCount++; continue; }
        nowItems.push(`- ${label} [status: ${status}]\n  ${detail}${reason ? `\n  Why: ${reason}` : ""}\n  Source: ${result.name}`);
      } else if (i.priority === "today" || i.priority === "TODAY") {
        const label = i.label || i.title || i.id || "Unknown";
        const detail = i.detail || i.description || "";
        const reason = i.reason || "";
        const status = i.status || "active";
        if (status === "completed") { ignoredCount++; continue; }
        todayItems.push(`- ${label} [status: ${status}]\n  ${detail}${reason ? `\n  Why: ${reason}` : ""}\n  Source: ${result.name}`);
      } else {
        ignoredCount++;
      }
    }
  }

  if (nowItems.length > 0) {
    lines.push("## NOW", ...nowItems, "");
  }
  if (todayItems.length > 0) {
    lines.push("## TODAY", ...todayItems, "");
  }
  if (ignoredCount > 0) {
    lines.push(`## IGNORED (${ignoredCount} items)`, "");
  }

  // Check for remove overrides
  const removeMatch = overrideContent.match(/## Remove\n([\s\S]*?)(?=\n##|$)/);
  if (removeMatch) {
    const removeLines = removeMatch[1].trim().split("\n").filter((l) => l.startsWith("- "));
    if (removeLines.length > 0) {
      lines.push(`*${removeLines.length} items suppressed via overrides*`, "");
    }
  }

  return lines.join("\n");
}

function renderDecisions(results: SourceResult[]): string {
  const fm = makeFrontmatter({ sources: results.map((r) => r.name) });
  const lines: string[] = [fm, "# Recent Decisions", ""];

  const decisionResults = results.filter((r) => r.target === "decisions" && r.items.length > 0);

  const today = new Date().toISOString().split("T")[0];
  lines.push(`## ${today}`);

  for (const result of decisionResults) {
    for (const item of result.items) {
      const i = item as Record<string, unknown>;
      const title = i.title || i.decision || i.description || "Unknown";
      const meeting = i.meeting_title || i.meeting || "";
      lines.push(`- **${title}**${meeting ? `\n  Meeting: ${meeting}` : ""}\n  Source: ${result.name}`);
    }
  }

  if (decisionResults.length === 0) {
    lines.push("- (No new decisions from sources)");
  }

  lines.push("");
  return lines.join("\n");
}

function renderState(results: SourceResult[]): Record<string, string> {
  const stateFiles: Record<string, string> = {};
  const stateResults = results.filter((r) => r.target === "state" && r.items.length > 0);

  // Group by repo
  const byRepo = new Map<string, unknown[]>();
  for (const result of stateResults) {
    for (const item of result.items) {
      const i = item as Record<string, unknown>;
      const repo = (i.repo || i.repository || "unknown") as string;
      if (!byRepo.has(repo)) byRepo.set(repo, []);
      byRepo.get(repo)!.push(item);
    }
  }

  for (const [repo, items] of byRepo) {
    const fm = makeFrontmatter({ sources: ["github"] });
    const lines = [fm, `# ${repo}`, "", "## Open Items"];
    for (const item of items) {
      const i = item as Record<string, unknown>;
      const num = i.number || "";
      const title = i.title || "";
      const labels = Array.isArray(i.labels) ? i.labels.map((l: any) => l.name || l).join(", ") : "";
      lines.push(`- #${num} — ${title}${labels ? ` [${labels}]` : ""}`);
    }
    lines.push("");
    stateFiles[`${repo}.md`] = lines.join("\n");
  }

  return stateFiles;
}

function writeSourcesMetadata(results: SourceResult[]): void {
  const briefDir = getBriefDir();
  const lines = results.map((r) => {
    const status = r.error ? "error" : "healthy";
    return `${r.name}: last_success=${new Date().toISOString()} status=${status} items=${r.items.length} duration=${r.duration}ms${r.error ? ` error="${r.error}"` : ""}`;
  });
  writeFileSync(join(briefDir, FILES.sources), lines.join("\n"));
}

function archiveExpired(briefDir: string): void {
  const priFile = join(briefDir, FILES.priorities);
  if (!existsSync(priFile)) return;

  let content = readFileSync(priFile, "utf-8");
  const today = new Date().toISOString().split("T")[0];

  // Find and remove expired sections
  const expiresRegex = /<!-- expires: (\d{4}-\d{2}-\d{2}) -->/g;
  let match;
  let archived = 0;

  while ((match = expiresRegex.exec(content)) !== null) {
    if (match[1] <= today) {
      // Find the section this belongs to and comment it out
      const lineStart = content.lastIndexOf("\n##", match.index);
      const nextSection = content.indexOf("\n##", match.index + 1);
      if (lineStart >= 0) {
        const section = content.slice(lineStart, nextSection > 0 ? nextSection : undefined);
        content = content.replace(section, `\n<!-- ARCHIVED (expired ${match[1]}) ${section.trim()} -->\n`);
        archived++;
      }
    }
  }

  if (archived > 0) {
    writeFileSync(priFile, content);
  }
}

export async function syncCommand(): Promise<void> {
  const briefDir = getBriefDir();

  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  const config = loadConfig();

  if (config.sources.length === 0) {
    console.log(chalk.yellow("  No sources configured in brief.toml. Add sources to sync from.\n"));
    return;
  }

  console.log(chalk.dim(`  Syncing from ${config.sources.length} source(s)...`));

  // Run all sources in parallel
  const results = await Promise.all(config.sources.map(runSource));

  // Report source results
  for (const r of results) {
    if (r.error) {
      console.log(chalk.yellow(`  ⚠ ${r.name}: failed (${r.error})`));
    } else {
      console.log(chalk.dim(`  ✓ ${r.name}: ${r.items.length} items (${r.duration}ms)`));
    }
  }

  // Render files
  const priorities = renderPriorities(results, config);
  writeFileSync(join(briefDir, FILES.priorities), priorities);

  const decisions = renderDecisions(results);
  writeFileSync(join(briefDir, FILES.decisions), decisions);

  // Render state files
  const stateDir = join(briefDir, DIRS.state);
  mkdirSync(stateDir, { recursive: true });
  const stateFiles = renderState(results);
  for (const [filename, content] of Object.entries(stateFiles)) {
    writeFileSync(join(stateDir, filename), content);
  }

  // Write source health metadata
  writeSourcesMetadata(results);

  // Auto-archive expired items
  archiveExpired(briefDir);

  // Update hash
  writeHash(computeHash());

  const total = results.reduce((sum, r) => sum + r.items.length, 0);
  console.log(chalk.green(`\n  ✓ Brief synced. ${total} items from ${results.length} sources.\n`));
}
