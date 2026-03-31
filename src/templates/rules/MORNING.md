# Morning Workflow

Start-of-day routine. Follow these steps.

## Steps

### 1. Check if human priorities exist
Read `.brief/PRIORITIES-HUMAN.md`.
- If it doesn't exist: run the interview first (`rules/INTERVIEW.md`). You can't build a good brief without human input.
- If it's older than 7 days: flag to the user: "Priority interview is overdue. Should we review priorities?"

### 2. Fetch fresh data
```bash
brief fetch
```

### 3. Check if brief needs rebuilding
```bash
brief check --enrichment
```
- Exit 0: brief is current. Skip to step 5.
- Exit 5: brief is stale. Continue to step 4.

### 4. Build the brief
Read `.brief/rules/BUILD.md` and follow the process:
1. Start with PRIORITIES-HUMAN.md (human rankings)
2. Cross-reference with `.brief/raw/*` (source data)
3. Apply overrides and graph
4. Write enriched `.brief/PRIORITIES.md`

### 5. Read your priorities
```
cat .brief/PRIORITIES.md
```
Or for your filtered view, check if `[agents.yourname]` is in brief.toml and filter accordingly.

### 6. Pick your first task
Choose the top item from URGENT or NOW.
If nothing in URGENT/NOW — work on TODAY items.

### 7. Log that you're starting
```bash
echo "- $(date -Iseconds) | [agent-name] | Read PRIORITIES.md | Starting [task] | Reason: top priority" >> .brief/LOG.md
```

## Quick version (for cron)

```bash
brief fetch
brief check --enrichment
# If exit 5: follow BUILD.md → write PRIORITIES.md
cat .brief/PRIORITIES.md
# Work on item #1
```
