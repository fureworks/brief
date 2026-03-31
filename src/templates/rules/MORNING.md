# Morning Workflow

Start-of-day routine. Run this or follow these steps at the beginning of each work session.

## Steps

### 1. Fetch fresh data
```bash
brief fetch
```
Or manually run the commands in `.brief/rules/FETCH.md`.

### 2. Check if brief needs rebuilding
```bash
brief check --enrichment
```
- Exit 0: brief is current. Skip to step 4.
- Exit 5: brief is stale. Continue to step 3.

### 3. Build the brief
Read `.brief/rules/BUILD.md` and follow the process.
Read all files in `.brief/raw/` for source data.
Write the enriched output to `.brief/PRIORITIES.md`.

```bash
brief enrich-done
```

### 4. Read your priorities
```bash
brief read priorities
# Or for your filtered view:
brief read priorities --agent [your-name]
```

### 5. Pick your first task
Choose the top item from your priority tier.
If nothing in URGENT or NOW — you have a good day, work on TODAY items.

### 6. Log that you're starting
```bash
brief log write "Read priorities" --agent [name] --action "Starting [task description]"
```

## Quick version (for cron / automated agents)

```bash
brief fetch
result=$(brief check --enrichment 2>/dev/null); code=$?
if [ $code -eq 5 ]; then
  # Agent: read BUILD.md + raw/ → write PRIORITIES.md
  brief enrich-done
fi
brief read priorities --agent [name]
# Work on item #1
```
