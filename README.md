# Brief

**Team working memory for AI agents and humans.**

Brief is an open convention + CLI for sharing dynamic context across a team. A `.brief/` directory of markdown files gives any AI coding tool (Claude Code, Codex, Cursor) and any human the context they need: what to work on, why, what changed, who's doing what.

## Install

```bash
npm install -g @fureworks/brief
```

## Quick Start

```bash
# Create .brief/ with example content
brief init --template startup

# Edit priorities
$EDITOR .brief/priorities.md

# Check for changes (agents run this before each task)
brief check

# Show freshness of all files
brief status

# Add urgent item (with optional Telegram notification)
brief urgent "CIMB deadline moved to Friday"

# Get integration snippet for your AI tool
brief snippet claude
brief snippet codex
brief snippet cursor
```

## How It Works

Brief creates a `.brief/` directory with markdown files:

```
.brief/
├── priorities.md    # What needs attention now
├── decisions.md     # Recent decisions with rationale
├── team.md          # Who's on the team, roles
├── overrides.md     # Manual priority overrides (human-edited)
├── agent-log.md     # Agent action audit trail
├── state/           # Per-project current state
└── people/          # Per-person focus and assignments
```

Any AI tool can read these files. The CLI generates and validates them.

## For AI Tools

Agents check the brief before each task using `brief check`:

```bash
result=$(brief check 2>/dev/null)
code=$?
if [ $code -eq 2 ]; then
  # URGENT update — read immediately
  brief read priorities
elif [ $code -eq 1 ]; then
  # Files changed — read updated priorities
  brief read priorities
fi
# code 0: no changes, proceed normally
```

Exit codes: `0` = no changes, `1` = changed, `2` = urgent, `3` = no brief found.

Run `brief snippet claude` (or `codex`, `cursor`, `openclaw`) to get a ready-to-paste integration block.

## Commands

| Command | What it does |
|---------|-------------|
| `brief init` | Create `.brief/` directory structure |
| `brief init --template startup` | With example content |
| `brief validate` | Check frontmatter integrity |
| `brief check` | Hash-based change detection |
| `brief read [file]` | Read a brief file |
| `brief status` | Show freshness of all files |
| `brief snippet <tool>` | Integration snippet |
| `brief urgent <message>` | Add urgent item + optional notification |

## Principles

1. **Just files.** Markdown in a git repo. No database, no server.
2. **Works without the CLI.** `cat .brief/priorities.md` is valid.
3. **Tool-agnostic.** Any AI tool can read markdown.
4. **Context, not commands.** The brief is suggestive, not authoritative.
5. **Composes with existing conventions.** Feeds into CLAUDE.md, AGENTS.md — doesn't replace them.

## Spec

See [SPEC.md](./SPEC.md) for the full convention specification.

## License

MIT
