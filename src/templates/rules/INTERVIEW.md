# Priority Interview

Ask these questions to the team lead. Run weekly, or when priorities shift.
Save output to `.brief/PRIORITIES-HUMAN.md`.

## When to Run

- **First time:** during Brief setup (after SETUP.md)
- **Weekly:** every Monday or start of sprint
- **On-demand:** after a meeting that changed priorities, client escalation, or new deal

## Questions

### 1. Product priorities (rank P0 → P3)
"What are the product priorities right now? Rank them."
- Which products are revenue-critical this quarter?
- Are there compliance or security deadlines?
- Any contractual delivery dates?

### 2. Active deals and dependencies
"What deals or partnerships depend on engineering work?"
- Partner commitments with dates
- Revenue at risk if work is delayed
- Demo/pilot dates coming up

### 3. Blockers requiring human decision
"What is blocked waiting on YOUR decision?"
- PRs waiting for your review or merge
- Product decisions not yet made
- Access or infrastructure issues only you can resolve

### 4. What NOT to work on
"What should the team explicitly avoid this week?"
- Parked features
- Deprioritized products
- Items that look urgent by age but aren't truly important

### 5. Changes since last interview
"Anything new since last week?"
- Meetings that shifted priorities
- Client escalations
- New information that changes the plan

## Output Format

Save to `.brief/PRIORITIES-HUMAN.md`:

```markdown
# Human Priorities

Last reviewed: YYYY-MM-DD
Reviewer: [name]

## Product Priorities
- P0: [product] ([reason])
- P1: [product] ([reason])
- P2: [product] ([reason])
- P3: [product] ([reason])

## Active Deals
- [deal]: [product], [date], [revenue/impact]

## Do NOT Work On
- [item] ([reason])

## Blockers Needing Human Decision
- [item] — needs [who] to [do what]

## Notes
[any additional context from the interview]
```

## How BUILD.md Uses This

BUILD.md reads PRIORITIES-HUMAN.md to:
- Rank items by product priority (P0 item always outranks P3 item)
- Add deal context ("this PR blocks the $450M partnership")
- Filter out "do not work on" items from NOW/TODAY
- Flag blockers needing human decision

Without PRIORITIES-HUMAN.md, BUILD.md falls back to signal-only scoring (like Scope). With it, priorities reflect human judgment.
