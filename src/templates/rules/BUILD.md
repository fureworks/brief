# Brief Building Rules

How to combine fetched data into PRIORITIES.md.

## Input

Read all of these before building:
1. `.brief/PRIORITIES-HUMAN.md` — **START HERE.** Human-set product priorities (P0-P3), deal dependencies, what NOT to work on. This is the skeleton that everything else hangs on. If this file doesn't exist, run the interview first (see `rules/INTERVIEW.md`).
2. `.brief/raw/*.json` and `.brief/raw/*.md` — fetched data from sources (scope signals, GitHub PRs, KB context)
3. `.brief/OVERRIDES.md` — manual priority adjustments (add/remove/boost)
4. `.brief/GRAPH.md` — blocking relationships between items
5. Previous `.brief/PRIORITIES.md` — preserve enrichment context where items haven't changed

## Process

1. **Start with PRIORITIES-HUMAN.md** as the skeleton. Human priorities define the ranking.
   - P0 items always outrank P1, regardless of age or score
   - "Do NOT work on" items are excluded from NOW/TODAY
   - Deal dependencies add urgency context
2. **Cross-reference against scope data** — add scores, staleness, blocking signals
3. **Cross-reference against KB** — product priority, revenue targets, delivery dates
4. **Cross-reference against GitHub** — merge readiness (APPROVED+MERGEABLE = merge-now)
5. **Cross-reference against meetings** — recent decisions that change priorities
6. **Apply overrides** — boost, remove, add from OVERRIDES.md
7. **Apply graph** — if A blocks B, boost A. If blocker resolved, note it.
8. **Remove completed items** — check GitHub state, remove merged PRs and closed issues
9. **Group by urgency:**
   - URGENT: compliance, security, hard deadlines
   - NOW: revenue-critical, blocking others, approved PRs
   - TODAY: operational, maintenance, nice-to-have
   - IGNORED: count only, don't list

## Output Format

Write to `.brief/PRIORITIES.md`:

```markdown
---
brief_version: 1
updated: [ISO timestamp]
sources: [scope, kb, github, meetings, interview]
built_by: [agent name]
---

## Agent Quick Context
- **Product priorities:** [P0] Product A, [P1] Product B, [P2] Product C
- **Biggest risk:** [one line]
- **Biggest opportunity:** [one line]
- **Blocked on human:** [items needing human decision]
- **Free value (merge now):** [approved PRs ready to ship]
- **Team:** [who's on what]

## URGENT
<!-- expires: YYYY-MM-DD -->
- [item] [status: active]
  [what + why + business impact + action needed]
  Source: [which sources contributed]
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

## Rules

- Every item must have a reason for its priority level
- Staleness alone is NOT urgency — a 50-day-old P3 item is not NOW
- Compliance/security items with deadlines are always URGENT
- APPROVED+MERGEABLE PRs are always at least TODAY (free value)
- Items blocked on a specific person should say who: `[blocked on: name]`
- Keep Agent Quick Context to 8 lines max
