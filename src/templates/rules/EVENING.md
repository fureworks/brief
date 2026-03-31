# Evening Workflow

End-of-day routine. Run this at the end of each work session.

## Steps

### 1. Review what you did
Look at your work today:
- What PRs did you create, review, or merge?
- What issues did you close?
- What decisions were made?

### 2. Log your actions
```bash
brief log write "End of day review" --agent [name] --action "[summary of work done]"
```

### 3. Update assignments
If your focus changed or tasks completed:
```bash
brief assign [person] "[new focus]"
```

### 4. Log decisions
If any decisions were made during the day:
```bash
brief decision "[what was decided]"
```

### 5. Update relationships
If you discovered blocking relationships:
```bash
brief graph add blocks [item-a] [item-b]
```

### 6. Flag carry-overs
Items from URGENT/NOW that didn't get done — note why:
- Blocked on someone? Update PRIORITIES.md with `[blocked on: name]`
- Deprioritized? Use `brief override remove [item-id]`
- Still important? It stays for tomorrow

### 7. Commit the brief
```bash
cd [brief-repo]
git add -A
git commit -m "brief: end of day $(date +%Y-%m-%d)"
git push
```

## Quick version (for automated agents)

```bash
brief log write "EOD review" --agent [name] --action "[summary]" --reason "nightly cycle complete"
# Update any assignments, decisions, graph as needed
cd [brief-repo] && git add -A && git commit -m "brief: EOD $(date +%Y-%m-%d)" && git push
```
