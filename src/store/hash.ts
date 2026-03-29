import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getBriefDir, FILES } from "./paths.js";

function collectFiles(briefDir: string): string[] {
  const files: string[] = [];
  if (!existsSync(briefDir)) return files;

  for (const entry of readdirSync(briefDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(join(briefDir, entry.name));
    }
    if (entry.isDirectory()) {
      const subdir = join(briefDir, entry.name);
      for (const sub of readdirSync(subdir, { withFileTypes: true })) {
        if (sub.isFile() && sub.name.endsWith(".md")) {
          files.push(join(subdir, sub.name));
        }
      }
    }
  }
  return files.sort();
}

export function computeHash(base?: string): string {
  const briefDir = getBriefDir(base);
  const files = collectFiles(briefDir);
  const hash = createHash("sha256");
  for (const f of files) {
    hash.update(readFileSync(f));
  }
  return hash.digest("hex").slice(0, 16);
}

export function readStoredHash(base?: string): string | null {
  const hashFile = join(getBriefDir(base), FILES.hash);
  if (!existsSync(hashFile)) return null;
  return readFileSync(hashFile, "utf-8").trim();
}

export function writeHash(hash: string, base?: string): void {
  const hashFile = join(getBriefDir(base), FILES.hash);
  writeFileSync(hashFile, hash);
}

export function hasUrgent(base?: string): boolean {
  const priFile = join(getBriefDir(base), FILES.priorities);
  if (!existsSync(priFile)) return false;
  const content = readFileSync(priFile, "utf-8");
  return content.includes("## 🔴 URGENT");
}
