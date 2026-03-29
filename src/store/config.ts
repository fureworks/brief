import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface BriefConfig {
  brief: { version: number; maintainer?: string; team_repo?: string };
  sources: Array<{ name: string; type: string; command?: string; path?: string; target: string; priority: number; timeout?: number }>;
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
        // Simple TOML parsing for the fields we need
        const raw = readFileSync(path, "utf-8");
        const config = { ...DEFAULT_CONFIG };

        // Parse notify section
        const notifyMatch = raw.match(/\[notify\][\s\S]*?enabled\s*=\s*(true|false)/);
        if (notifyMatch) config.notify.enabled = notifyMatch[1] === "true";

        const tokenMatch = raw.match(/telegram_bot_token\s*=\s*"([^"]*)"/);
        if (tokenMatch) config.notify.telegram_bot_token = tokenMatch[1];

        const chatMatch = raw.match(/telegram_chat_id\s*=\s*"([^"]*)"/);
        if (chatMatch) config.notify.telegram_chat_id = chatMatch[1];

        return config;
      } catch {
        return DEFAULT_CONFIG;
      }
    }
  }

  return DEFAULT_CONFIG;
}
