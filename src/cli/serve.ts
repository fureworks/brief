import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "node:http";
import chalk from "chalk";
import { getBriefDir } from "../store/paths.js";
import { parseFrontmatter } from "../store/frontmatter.js";

interface ServeOptions {
  port?: string;
  render?: boolean;
}

function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "\n");
}

function renderPage(briefDir: string): string {
  const sections: string[] = [];

  function renderFile(filePath: string, name: string) {
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);
    const updated = frontmatter?.updated ? new Date(frontmatter.updated as unknown as string).toLocaleString() : "unknown";
    sections.push(`
      <section>
        <div class="meta">${name} · updated ${updated}</div>
        <div class="content">${mdToHtml(body)}</div>
      </section>
    `);
  }

  // Main files
  for (const name of ["priorities.md", "decisions.md", "team.md"]) {
    renderFile(join(briefDir, name), name);
  }

  // People
  const peopleDir = join(briefDir, "people");
  if (existsSync(peopleDir)) {
    for (const f of readdirSync(peopleDir).filter((f) => f.endsWith(".md"))) {
      renderFile(join(peopleDir, f), `people/${f}`);
    }
  }

  // State
  const stateDir = join(briefDir, "state");
  if (existsSync(stateDir)) {
    for (const f of readdirSync(stateDir).filter((f) => f.endsWith(".md"))) {
      renderFile(join(stateDir, f), `state/${f}`);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="60">
  <title>Brief</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Newsreader', Georgia, serif; font-size: 16px; line-height: 1.7; color: #374151; background: #fafaf9; }
    main { max-width: 640px; margin: 0 auto; padding: 3rem 1.5rem; }
    h1 { font-size: 1.5rem; font-weight: 500; color: #111; margin-bottom: 2rem; }
    section { margin-bottom: 2.5rem; padding-bottom: 2rem; border-bottom: 1px solid #f3f4f6; }
    section:last-child { border-bottom: none; }
    .meta { font-size: 0.75rem; color: #9ca3af; font-family: system-ui, sans-serif; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.1em; }
    .content h2 { font-size: 1.1rem; font-weight: 500; color: #111; margin: 1rem 0 0.5rem; }
    .content h3 { font-size: 1rem; font-weight: 500; color: #374151; margin: 0.75rem 0 0.25rem; }
    ul { padding-left: 1.5rem; margin: 0.5rem 0; }
    li { margin-bottom: 0.25rem; }
    strong { color: #111; }
    footer { text-align: center; font-size: 0.75rem; color: #9ca3af; margin-top: 3rem; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <main>
    <h1>Brief</h1>
    ${sections.join("\n")}
    <footer>Auto-refreshes every 60 seconds</footer>
  </main>
</body>
</html>`;
}

export async function serveCommand(options: ServeOptions): Promise<void> {
  const briefDir = getBriefDir();
  if (!existsSync(briefDir)) {
    console.log(chalk.red("  No .brief/ directory found. Run 'brief init' first.\n"));
    process.exit(3);
  }

  if (options.render) {
    const viewerDir = join(briefDir, ".viewer");
    mkdirSync(viewerDir, { recursive: true });
    const html = renderPage(briefDir);
    writeFileSync(join(viewerDir, "index.html"), html);
    console.log(chalk.green(`  ✓ Rendered to ${viewerDir}/index.html\n`));
    return;
  }

  const port = parseInt(options.port || "3030", 10);

  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderPage(briefDir));
  });

  server.listen(port, () => {
    console.log(chalk.green(`  ✓ Brief viewer at http://localhost:${port}\n`));
    console.log(chalk.dim("  Auto-refreshes every 60 seconds. Ctrl+C to stop.\n"));
  });
}
