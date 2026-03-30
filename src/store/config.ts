import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface BriefConfig {
  brief: { version: number; maintainer?: string; team_repo?: string };
  sources: Array<{ name: string; type: string; command?: string; path?: string; target: string; priority: number; timeout?: number; mapping?: Record<string, string> }>;
  notify: { enabled: boolean; telegram_bot_token?: string; telegram_chat_id?: string };
  health: { stale_threshold_hours: number; source_failure_threshold: number };
}

const DEFAULT_CONFIG: BriefConfig = {
  brief: { version: 1 },
  sources: [],
  notify: { enabled: false },
  health: { stale_threshold_hours: 4, source_failure_threshold: 2 },
};

export function loadConfig(base: string = process.cwd()): BriefConfig {
  // Search order: .brief/brief.toml → brief.toml → ~/.config/brief/brief.toml
  const candidates = [
    join(base, ".brief", "brief.toml"),
    join(base, "brief.toml"),
    join(process.env.HOME || "", ".config", "brief", "brief.toml"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        const raw = readFileSync(path, "utf-8");
        const config = { ...DEFAULT_CONFIG };

        // Parse notify section
        const notifyMatch = raw.match(/\[notify\][\s\S]*?enabled\s*=\s*(true|false)/);
        if (notifyMatch) config.notify.enabled = notifyMatch[1] === "true";

        const tokenMatch = raw.match(/telegram_bot_token\s*=\s*"([^"]*)"/);
        if (tokenMatch) config.notify.telegram_bot_token = tokenMatch[1];

        const chatMatch = raw.match(/telegram_chat_id\s*=\s*"([^"]*)"/);
        if (chatMatch) config.notify.telegram_chat_id = chatMatch[1];

        // Parse stale threshold
        const staleMatch = raw.match(/stale_threshold_hours\s*=\s*(\d+)/);
        if (staleMatch) config.health.stale_threshold_hours = parseInt(staleMatch[1], 10);

        // Parse sources (TOML array of tables)
        const sourceBlocks = raw.matchAll(/\[\[sources\]\]\s*\n([\s\S]*?)(?=\[\[|\[(?!\[)|$)/g);
        config.sources = [];
        for (const match of sourceBlocks) {
          const block = match[1];
          const name = block.match(/name\s*=\s*"([^"]*)"/)?.[1] || "";
          const type = block.match(/type\s*=\s*"([^"]*)"/)?.[1] || "";
          const command = block.match(/command\s*=\s*"([^"]*)"/)?.[1];
          const srcPath = block.match(/path\s*=\s*"([^"]*)"/)?.[1];
          const target = block.match(/target\s*=\s*"([^"]*)"/)?.[1] || "priorities";
          const priority = parseInt(block.match(/priority\s*=\s*(\d+)/)?.[1] || "0", 10);
          const timeout = parseInt(block.match(/timeout\s*=\s*(\d+)/)?.[1] || "15", 10);
          // Parse mapping if present
          const mappingMatch = block.match(/mapping\s*=\s*\{([^}]*)\}/);
          let mapping: Record<string, string> | undefined;
          if (mappingMatch) {
            mapping = {};
            const pairs = mappingMatch[1].matchAll(/(\w+)\s*=\s*"([^"]*)"/g);
            for (const pair of pairs) {
              mapping[pair[1]] = pair[2];
            }
          }
          config.sources.push({ name, type, command, path: srcPath, target, priority, timeout, mapping });
        }

        return config;
      } catch {
        return DEFAULT_CONFIG;
      }
    }
  }

  return DEFAULT_CONFIG;
}
