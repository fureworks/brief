# Brief

**Team working memory for AI agents and humans.**

Brief is an open convention for sharing dynamic context across a team. A \`.brief/\` directory of markdown files — including rules that describe HOW to build and maintain the brief — gives any AI coding tool and any human the context they need.

The convention is the product. The CLI is optional.

## Quick Start

### Without CLI (just the convention)

Create a \`.brief/\` directory in your project or team repo:

\`\`\`
.brief/
├── PRIORITIES.md      # What matters now
├── DECISIONS.md       # Recent decisions
├── PEOPLE.md          # Who's doing what
├── rules/             # HOW to build the brief
│   ├── FETCH.md       # What data to fetch
│   ├── BUILD.md       # How to combine into priorities
│   ├── INTERVIEW.md   # Priority questions for human review
│   ├── MORNING.md     # Start-of-day workflow
│   └── EVENING.md     # End-of-day workflow
└── raw/               # Fetched source data
\`\`\`

Any AI tool reads these files. Agents follow the rules in \`rules/\` to build and maintain the brief.

### With CLI

\`\`\`bash
npm install -g @fureworks/brief
brief init --template startup    # creates .brief/ with rules templates
brief fetch                      # pull data from configured sources
brief build                      # output rules + data for agent to build PRIORITIES.md
brief morning                    # start-of-day workflow
brief evening                    # end-of-day workflow
\`\`\`

## How It Works

1. **Fetch** — pull data from your tools (Scope, GitHub, KB, meetings)
2. **Build** — agent reads BUILD.md rules + raw data → writes PRIORITIES.md
3. **Read** — any tool reads PRIORITIES.md for context before working
4. **Update** — log decisions, assignments, relationships throughout the day
5. **Review** — evening workflow captures what got done

The CLI doesn't do the thinking. It provides the rules and data. The agent does the thinking.

## Commands (23)

| Category | Commands |
|----------|---------|
| **Workflow** | \`fetch\`, \`build\`, \`morning\`, \`evening\`, \`interview\` |
| **Read** | \`read\`, \`check\`, \`status\`, \`snippet\` |
| **Write** | \`urgent\`, \`assign\`, \`decision\`, \`override\`, \`graph\`, \`log\` |
| **Enrichment** | \`enrich-context\`, \`enrich-done\`, \`check --enrichment\` |
| **Setup** | \`init\`, \`validate\`, \`doctor\`, \`serve\`, \`migrate\`, \`sync\` |

## Principles

1. **Convention first.** The \`.brief/\` directory IS the product. The CLI is optional.
2. **Rules in markdown.** \`rules/\` files describe HOW to build context. Agents follow them.
3. **Agent does the thinking.** The CLI fetches data and outputs rules. The agent enriches.
4. **Context, not commands.** Brief informs decisions. It doesn't direct actions.
5. **Tool-agnostic.** Works with Claude Code, Codex, Cursor, or any tool that reads files.

## Spec

See [SPEC.md](./SPEC.md) for the full convention specification.

## License

MIT
