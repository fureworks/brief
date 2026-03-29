import yaml from "js-yaml";

export interface BriefFrontmatter {
  brief_version: number;
  updated: string;
  sources?: string[];
  maintainer?: string;
}

export function parseFrontmatter(content: string): { frontmatter: BriefFrontmatter | null; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: content };

  try {
    const fm = yaml.load(match[1]) as BriefFrontmatter;
    return { frontmatter: fm, body: match[2] };
  } catch {
    return { frontmatter: null, body: content };
  }
}

export function makeFrontmatter(opts: Partial<BriefFrontmatter> = {}): string {
  const fm: BriefFrontmatter = {
    brief_version: opts.brief_version ?? 1,
    updated: opts.updated ?? new Date().toISOString(),
    sources: opts.sources ?? ["manual"],
    maintainer: opts.maintainer,
  };
  const lines = [
    "---",
    `brief_version: ${fm.brief_version}`,
    `updated: ${fm.updated}`,
    `sources: [${fm.sources?.join(", ") ?? "manual"}]`,
  ];
  if (fm.maintainer) lines.push(`maintainer: ${fm.maintainer}`);
  lines.push("---", "");
  return lines.join("\n");
}

export function validateFrontmatter(fm: BriefFrontmatter | null): string[] {
  const errors: string[] = [];
  if (!fm) {
    errors.push("Missing or invalid YAML frontmatter");
    return errors;
  }
  if (typeof fm.brief_version !== "number") errors.push("Missing brief_version (number)");
  if (!fm.updated) errors.push("Missing updated (ISO-8601 date)");
  return errors;
}
