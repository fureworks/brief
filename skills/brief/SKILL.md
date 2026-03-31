---
name: brief
description: "Team working memory convention. A .brief/ directory with markdown files for priorities, decisions, assignments, and rules that describe HOW to build context. Use when: (1) starting any task — read .brief/PRIORITIES.md first, (2) building daily priorities — follow .brief/rules/BUILD.md, (3) morning/evening workflow — follow rules/MORNING.md or EVENING.md. CLI has 3 commands: brief init, brief fetch, brief check. Everything else is reading/writing markdown files."
---

# Brief — Team Working Memory

`.brief/` directory with markdown files. Rules tell you what to do. CLI is minimal.

## Before Every Task

```bash
brief check
# exit 0: no changes, proceed
# exit 1: files changed — read .brief/PRIORITIES.md
# exit 2: urgent — read .brief/PRIORITIES.md immediately
```

Or just: `cat .brief/PRIORITIES.md`

## Morning

```bash
brief fetch                         # pull source data → .brief/raw/
brief check --enrichment            # exit 5 = stale
# If stale: read .brief/rules/BUILD.md, follow it
# Read .brief/raw/* for source data
# Write enriched .brief/PRIORITIES.md
```

Or read `.brief/rules/MORNING.md` and follow the steps.

## During Work

All file operations — no CLI needed:

```bash
# Log a decision
echo "- **Switched to JWT** ($(date -Iseconds))" >> .brief/DECISIONS.md

# Assign work
# Edit .brief/PEOPLE.md

# Log agent action
echo "- $(date -Iseconds) | $BRIEF_AGENT_NAME | action description" >> .brief/LOG.md

# Track relationship
echo "- issue:repo#45 blocks pr:repo#62 ($(date +%Y-%m-%d))" >> .brief/GRAPH.md

# Add urgent item
# Prepend to .brief/PRIORITIES.md
```

## Evening

Read `.brief/rules/EVENING.md` and follow the steps.

## Rules Directory

| File | When to read |
|------|-------------|
| `rules/FETCH.md` | Setting up data sources |
| `rules/BUILD.md` | Building PRIORITIES.md from raw data |
| `rules/INTERVIEW.md` | Weekly priority review with human |
| `rules/MORNING.md` | Start of day |
| `rules/EVENING.md` | End of day |

The rules ARE the convention. Read them, follow them.

## CLI (3 commands only)

```bash
brief init          # create .brief/ with rules templates
brief fetch         # pull configured sources → raw/
brief check         # change detection (exit codes for automation)
```
