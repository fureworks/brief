# Brief v2 Architecture — Convention-First Restructure

**Date:** 2026-03-31
**Status:** Approved

## Architecture Shift

Brief v1 was CLI-first: commands fetch, format, and render data.
Brief v2 is convention-first: markdown files describe HOW to build context. The CLI orchestrates agents that follow the rules. The agent does the thinking.

## New Directory Structure

```
.brief/
├── PRIORITIES.md          # Output: what matters now (enriched by agent)
├── DECISIONS.md           # Output: recent decisions
├── PEOPLE.md              # Output: assignments
├── GRAPH.md               # Output: relationships
├── LOG.md                 # Output: agent audit trail
├── OVERRIDES.md           # Human-edited: priority adjustments
│
├── rules/                 # Convention: HOW to build the brief
│   ├── FETCH.md           # What data to fetch and how
│   ├── INTERVIEW.md       # Priority questions for the human
│   ├── BUILD.md           # How to combine data into priorities
│   ├── MORNING.md         # Start-of-day workflow
│   └── EVENING.md         # End-of-day workflow
│
├── raw/                   # Auto-generated: fetched data
│   ├── scope.json
│   ├── github-prs.json
│   └── kb-context.md
│
├── .hash                  # Change detection
├── .enrichment-state      # Enrichment staleness tracking
└── brief.toml             # Data source config + automation
```

## CLI Commands (restructured)

### Core workflow
```bash
brief init [--template startup]     # Create .brief/ with rules/ templates
brief fetch                         # Run fetch commands from FETCH.md / brief.toml → raw/
brief build                         # Prompt agent: read BUILD.md + raw/ → write PRIORITIES.md
brief morning                       # Prompt agent: read MORNING.md workflow
brief evening                       # Prompt agent: read EVENING.md workflow
brief interview                     # Prompt agent: read INTERVIEW.md, ask priority questions
```

### Reading
```bash
brief read [file]                   # Read a .brief/ file
brief read priorities --agent NAME  # Per-agent filtered view
brief check                         # Hash-based change detection (exit codes)
brief check --enrichment            # Enrichment staleness
brief status                        # File freshness
```

### Writing
```bash
brief urgent "message"              # Inject urgent item
brief assign <person> <item>        # Assign work
brief decision "description"        # Log decision
brief override <add|remove|boost>   # Priority overrides
brief graph <add|query>             # Relationship links
brief log <write|view>              # Agent audit trail
brief enrich-done                   # Mark enrichment complete
```

### Utilities
```bash
brief doctor                        # Source health
brief validate                      # Frontmatter integrity
brief serve                         # Web viewer
brief snippet <tool>                # AI tool integration code
brief migrate                       # Schema migration
```

## Rules Files (the convention heart)

### FETCH.md
Declares what data to fetch. Agent reads this and executes the commands.
Output goes to .brief/raw/

### INTERVIEW.md  
Questions to ask the human (weekly or on priority shift). Captures product priorities P0-P3, deal dependencies, blockers, what NOT to work on.

### BUILD.md
Step-by-step rules for combining raw data + interview answers + overrides + graph into PRIORITIES.md. This is the enrichment logic, declared in natural language.

### MORNING.md
Start-of-day workflow: sync, check enrichment, read priorities, pick task.

### EVENING.md
End-of-day workflow: review what was done, log actions, update assignments, flag carry-overs.

## CLI Behavior Change

`brief fetch` replaces `brief sync` for the data-fetching step.
`brief build` replaces the enrichment convention — it prompts the agent to follow BUILD.md.
`brief morning` and `brief evening` are workflow runners that output the rules for the agent.

The CLI does NOT run the LLM. It outputs prompts/rules that the agent follows. The agent is the intelligence.

## Implementation Tasks

1. Create rules/ directory with template files (FETCH.md, INTERVIEW.md, BUILD.md, MORNING.md, EVENING.md)
2. Rename `brief sync` → `brief fetch` (data fetching only, no rendering)
3. Add `brief build` command (outputs BUILD.md rules + raw data for agent)
4. Add `brief morning` command (outputs MORNING.md workflow)
5. Add `brief evening` command (outputs EVENING.md workflow)
6. Add `brief interview` command (outputs INTERVIEW.md questions)
7. Update `brief init` to create rules/ with templates
8. Update SPEC.md with v2 architecture
9. Update skill files
10. Update README
