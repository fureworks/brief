# Brief Enrichment Guide — For AI Agents

After `brief sync` pulls raw signals, an agent enriches priorities.md with context from the team's knowledge base, pipeline, meetings, and decisions.

This is the step that turns "PR #62 is 46 days old" into "PR #62 is 46 days old, blocks PDP compliance, $600K ARR pipeline depends on it, merge immediately."

## The Enrichment Flow

```
brief sync                     # 1. Pull raw signals from configured sources
[agent reads + enriches]       # 2. Agent cross-references with KB, pipeline, meetings
brief validate                 # 3. Verify output is well-formed
```

## Step-by-Step

### 1. Gather raw signals

```bash
brief sync
brief read priorities          # see what sync produced
```

### 2. Gather context sources

After sync, all source content is available in `.brief/`. Read the synced files first — they contain KB and pipeline data pulled by directory sources:

```bash
brief read priorities          # scope items + KB items (raw, not cross-referenced)
brief read decisions           # meeting decisions
brief read state/project-c     # project state if generated
```

Then read additional context directly if needed:

```bash
# Knowledge base — product priorities, roadmap, delivery tracker
cat ~/repos/team-knowledgebase/DELIVERY-TRACKER.md
cat ~/repos/team-knowledgebase/dashboards/product-kpis.md

# Partnership pipeline — which deals depend on which work
cat ~/shared-knowledge/partnerships/pipeline-status.md

# Recent meeting decisions
mcporter call meetingtool.list_action_items status=pending --output json 2>/dev/null
mcporter call meetingtool.list_decisions status=approved limit=10 --output json 2>/dev/null

# GitHub PR state — what's actually merge-ready
gh pr list --state open --json number,title,reviewDecision,mergeable --limit 20 2>/dev/null
```

### 3. Enrich priorities.md

Read the current `.brief/priorities.md` and rewrite it with enriched context. Follow this format:

```markdown
---
brief_version: 1
updated: [current ISO timestamp]
sources: [scope, kb, pipeline, meetings, github]
---

# Priorities

## 🔴 URGENT
<!-- expires: YYYY-MM-DD -->
- [item] [status: active]
  [what it is + why it's urgent + what it blocks + business impact]
  Source: [which sources contributed to this assessment]
  Ref: [link]

## NOW
- [item] [status: active]
  [what + why + impact]
  Source: [sources]

## TODAY
- [item] [status: active]
  [what + why]
  Source: [sources]

## IGNORED ([N] items)
```

### Enrichment rules:

1. **Cross-reference every Scope item against the KB.** If the KB says a project is P0/P1, that context goes into the item description.

2. **Check pipeline impact.** If a partnership or deal depends on a work item, mention it: "Blocks [partner] pilot, [revenue] at risk."

3. **Check meeting decisions.** If a recent meeting changed priorities, override the Scope ranking: "Reprioritized in [date] meeting."

4. **Check merge readiness.** If a PR is APPROVED + MERGEABLE, boost it: "Ready to merge — free value."

5. **Add relationship context.** If item A blocks item B, say so: "Blocks PR #52 which blocks the compliance audit."

6. **Remove completed items.** If an item was resolved since last sync, mark `[status: completed]` or remove it.

7. **Preserve source attribution.** Every item should say where its priority assessment came from.

### 4. Update people files

If assignments changed based on the enriched priorities:

```bash
brief assign alice "project-c-compliance"
brief assign bob "project-b-lti-merge"
```

### 5. Log the enrichment

```bash
brief log write "Enriched priorities.md" --agent $BRIEF_AGENT_NAME --action "Cross-referenced scope + KB + pipeline + meetings" --reason "Nightly enrichment cycle"
```

### 6. Validate and commit

```bash
brief validate
cd ~/team-brief && git add -A && git commit -m "brief: enriched priorities $(date +%Y-%m-%d)"
```

## Example: Before and After Enrichment

### Before (raw sync output):
```
- PR #62 on project-c [status: active]
  fix: implement account deletion — open 46 days
  Why: Open 46 days. Getting stale.
  Source: scope
```

### After (enriched):
```
- PR #62 on project-c [status: active]
  fix: implement account deletion — APPROVED, MERGEABLE, 46 days
  Why: PDP compliance requirement. Blocks compliance audit. Partner pilot (MTFA) depends on this.
  Action: merge immediately, no code changes needed.
  Source: scope + kb (P0 compliance) + pipeline (MTFA pilot)
  Ref: https://github.com/example-org/project-c/pull/62
```

## Automation

Add enrichment to your agent's nightly cycle:

```
C1 Build start:
  1. brief sync                    # pull raw signals
  2. [read KB, pipeline, meetings] # gather context
  3. [rewrite priorities.md]       # enrich with context
  4. brief validate                # verify
  5. brief log write ...           # audit
  6. git commit                    # persist
  7. brief check                   # set baseline for the day
```

The enrichment step is where agent intelligence adds the most value. Brief provides the structure. The agent provides the judgment.
