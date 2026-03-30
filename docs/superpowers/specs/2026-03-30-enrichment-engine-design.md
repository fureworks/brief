# Brief Enrichment Engine — Design Spec

**Date:** 2026-03-30
**Status:** Approved for implementation

## Problem

Scout's nightly cycle spends 15+ minutes gathering context before working. Brief has the raw signals but:
1. Agent doesn't know when enrichment is stale vs current
2. Agent doesn't know what files to read for enrichment
3. Agent doesn't know what rules to follow
4. Different agents need different views of the same data
5. Re-enrichment happens even when raw data hasn't changed (token waste)

## Solution

Add three capabilities to Brief:

### 1. Enrichment Staleness Detection

Track the relationship between `priorities-raw.md` and `priorities.md`:

```
.brief/.enrichment-state
```

Contains:
```json
{
  "raw_hash": "abc123",
  "enriched_at": "2026-03-30T17:55:00Z",
  "enriched_from_raw_hash": "abc123",
  "agent": "scout"
}
```

New command:
```bash
brief check --enrichment
# Exit codes:
# 0 = enrichment is current (raw hash matches)
# 1 = enrichment is stale (raw updated since last enrichment)
# 3 = no brief found
```

When `brief sync` updates `priorities-raw.md`, the raw hash changes. Next `brief check --enrichment` detects the mismatch → agent knows to re-enrich.

After enrichment, agent runs:
```bash
brief enrich-done
# Updates .enrichment-state with current raw hash + timestamp
```

### 2. Enrichment Config in brief.toml

```toml
[enrichment]
# Files the enrichment agent should read for context
context_files = [
  "~/repos/team-kb/DELIVERY-TRACKER.md",
  "~/repos/team-kb/dashboards/product-kpis.md",
  "~/shared-knowledge/partnerships/pipeline-status.md",
]

# GitHub repos to check for merge readiness
github_repos = [
  "org/project-a",
  "org/project-b",
  "org/project-c",
]
github_fields = "number,title,reviewDecision,mergeable,labels"

# Natural language rules the enrichment agent follows
rules = """
1. Cross-reference scope items against DELIVERY-TRACKER for product priority
2. Check pipeline for deals that depend on dev work
3. Mark APPROVED+MERGEABLE PRs as merge-now
4. Group by: URGENT (compliance/security), NOW (revenue-critical), TODAY (operational)
5. Remove parked items from NOW — staleness alone is not urgency
"""
```

New command:
```bash
brief enrich-context
# Outputs all context files + github data + rules
# Agent pipes this into their enrichment prompt
```

This replaces "agent has to discover ENRICH.md and improvise." The config declares everything.

### 3. Per-Agent Views

```toml
[agents.scout]
focus = ["github-prs", "github-issues", "ci-status", "compliance"]
hide = ["pipeline-details", "content-calendar"]

[agents.reed]
focus = ["pipeline", "partner-meetings", "deal-blockers", "revenue"]
hide = ["pr-numbers", "ci-status"]
```

New command:
```bash
brief read priorities --agent scout
# Filters priorities.md sections based on agent's focus/hide config
# Falls back to full file if no agent config found
```

## Architecture

### New files:
- `src/store/enrichment.ts` — enrichment state tracking (read/write .enrichment-state)
- `src/cli/enrich-context.ts` — outputs enrichment context for agents
- Modify `src/cli/check.ts` — add `--enrichment` flag
- Modify `src/cli/read.ts` — add `--agent` flag
- Modify `src/store/config.ts` — parse `[enrichment]` and `[agents.*]` sections

### New .brief/ file:
- `.enrichment-state` — JSON tracking raw hash vs enrichment hash

### Config additions:
```toml
[enrichment]
context_files = [...]
github_repos = [...]
github_fields = "..."
rules = """..."""

[agents.NAME]
focus = [...]
hide = [...]
```

## CLI Changes

```bash
# Enrichment staleness
brief check --enrichment       # is enrichment current?
brief enrich-done              # mark enrichment as complete

# Enrichment context
brief enrich-context           # output all context for enrichment agent
brief enrich-context --json    # machine-readable

# Per-agent view
brief read priorities --agent scout
brief read priorities --agent reed
```

## Agent Workflow (after these changes)

```
# Pre-flight (cheap model)
brief sync                          # pull raw signals
brief check --enrichment            # is enrichment stale?
  exit 0 → skip enrichment, use existing priorities.md
  exit 1 → run enrichment:
    context=$(brief enrich-context)  # get all context + rules
    [agent reads context, writes enriched priorities.md]
    brief enrich-done               # mark enrichment complete

# Work session (expensive model)
brief read priorities --agent scout  # filtered view
[work on item #1]
brief log write ...
```

15 minutes of context gathering → 30 seconds of brief commands.

## What this does NOT do

- Brief does NOT run the LLM. The agent does.
- Brief does NOT interpret enrichment rules. They're natural language for the agent.
- Brief does NOT decide what to work on. It provides context. The agent decides.
- Brief stays infrastructure. The agent stays intelligence.
