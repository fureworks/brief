import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getBriefDir } from "./paths.js";
import { computeHash } from "./hash.js";

const STATE_FILE = ".enrichment-state";

export interface EnrichmentState {
  schema_version: number;
  raw_hash: string;
  enriched_at: string;
  enriched_from_raw_hash: string;
  owner: string;
}

function getStatePath(base?: string): string {
  return join(getBriefDir(base), STATE_FILE);
}

export function loadEnrichmentState(base?: string): EnrichmentState | null {
  const path = getStatePath(base);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function saveEnrichmentState(state: EnrichmentState, base?: string): void {
  writeFileSync(getStatePath(base), JSON.stringify(state, null, 2));
}

export async function getRawHash(base?: string): Promise<string> {
  const briefDir = getBriefDir(base);
  const rawFile = join(briefDir, "priorities-raw.md");
  if (!existsSync(rawFile)) return "";
  const crypto = await import("node:crypto");
  return crypto.createHash("sha256").update(readFileSync(rawFile)).digest("hex").slice(0, 16);
}

export async function isEnrichmentStale(base?: string): Promise<boolean> {
  const state = loadEnrichmentState(base);
  if (!state) return true;
  const currentRawHash = await getRawHash(base);
  return state.enriched_from_raw_hash !== currentRawHash;
}

export async function markEnrichmentDone(agent: string, base?: string): Promise<void> {
  const rawHash = await getRawHash(base);
  const state: EnrichmentState = {
    schema_version: 1,
    raw_hash: rawHash,
    enriched_at: new Date().toISOString(),
    enriched_from_raw_hash: rawHash,
    owner: agent,
  };
  saveEnrichmentState(state, base);
}
