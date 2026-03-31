---
name: brief
description: "Use the Brief convention + CLI for team working memory. Brief provides rules (markdown files) that describe HOW to build and maintain team context. Use when: (1) starting any task — check the brief first, (2) building daily priorities from multiple sources, (3) logging decisions/assignments, (4) morning/evening workflow, (5) priority interviews. Rules in .brief/rules/ tell you exactly what to do. Requires `brief` CLI (`npm i -g @fureworks/brief`) for automation, but works without it."
---

# Brief — Team Working Memory

Brief provides dynamic team context via `.brief/` directory files. The `rules/` directory tells agents HOW to build and maintain the brief.

## Daily Workflow

### Morning
```bash
brief fetch                        # pull data from sources → .brief/raw/
brief check --enrichment           # exit 5 = stale, 0 = current
# If stale:
brief build                        # outputs BUILD.md rules + raw data
# Follow the rules to write .brief/PRIORITIES.md
brief enrich-done                  # mark enrichment complete
# Then:
brief read priorities              # your context for the day
```

Or read the rules directly: `cat .brief/rules/MORNING.md`

### Evening
```bash
brief evening                      # outputs evening workflow rules
# Log what you did:
brief log write "description" --agent $BRIEF_AGENT_NAME --action "what was done"
brief decision "any decisions made today"
```

Or read: `cat .brief/rules/EVENING.md`

### Weekly
```bash
brief interview                    # outputs priority questions for human review
```

## Reading Context

```bash
brief read priorities              # what matters now
brief read priorities --agent NAME # filtered view for specific agent
brief read decisions               # recent decisions
brief read people/alice            # assignments
brief check                        # 0=ok, 1=changed, 2=urgent, 3=no brief
brief check --enrichment           # 0=current, 5=stale
```

## Writing Context

```bash
brief decision "switched to JWT"
brief assign alice "project-c-compliance"
brief urgent "deadline moved" --expires 2026-04-04
brief override add/remove/boost
brief graph add blocks item-a item-b
brief log write "description" --agent NAME --action "what"
```

## Rules Directory

`.brief/rules/` contains markdown files that describe HOW to build the brief:

| File | Purpose |
|------|---------|
| FETCH.md | What data to fetch and how |
| BUILD.md | How to combine raw data into PRIORITIES.md |
| INTERVIEW.md | Priority questions for human review |
| MORNING.md | Start-of-day workflow |
| EVENING.md | End-of-day workflow |

Read the relevant rule file, follow its instructions. The rules ARE the convention.

## Enrichment

After `brief fetch` pulls raw data, read `rules/BUILD.md` and follow it to write an enriched PRIORITIES.md. See `skills/brief/ENRICH.md` for the full guide.

## Key Principles

- **Check before every task** — `brief check` is cheap
- **Rules are the convention** — `rules/*.md` tell you what to do
- **Context, not commands** — brief informs, doesn't direct
- **Log your actions** — `brief log write` for audit trail
