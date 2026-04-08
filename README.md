# Brief

**Team working memory for AI agents and humans.**

A `.brief/` directory of markdown files that any AI tool reads for context. Rules files describe HOW to build and maintain the brief. The convention is the product.

## Quick Start

```bash
npm install -g @fureworks/brief
brief init --template startup
```

This creates:

```
.brief/
├── PRIORITIES.md       # What matters now (agent writes this)
├── DECISIONS.md        # Recent decisions
├── PEOPLE.md           # Who's doing what
├── OVERRIDES.md        # Manual priority adjustments
├── GRAPH.md            # Relationships between items
├── LOG.md              # Agent audit trail
├── rules/              # HOW to build the brief
│   ├── FETCH.md        # What data to fetch
│   ├── BUILD.md        # How to combine into priorities
│   ├── INTERVIEW.md    # Priority questions for humans
│   ├── MORNING.md      # Start-of-day workflow
│   └── EVENING.md      # End-of-day workflow
└── raw/                # Fetched source data
```

## The CLI (3 commands)

```bash
brief init              # create .brief/ with rules templates
brief fetch             # pull data from sources → raw/
brief check             # exit 0=ok, 1=changed, 2=urgent, 5=enrichment stale
```

That's it. Everything else is the convention — markdown files that agents read and follow.

## The Convention (everything else)

Agents already know how to read files, edit files, and run commands. They don't need a CLI for that.

| Action | How |
|--------|-----|
| Read priorities | `cat .brief/PRIORITIES.md` |
| Morning workflow | Read `.brief/rules/MORNING.md`, follow the steps |
| Build priorities | Read `.brief/rules/BUILD.md` + `.brief/raw/*`, write PRIORITIES.md |
| Evening review | Read `.brief/rules/EVENING.md`, follow the steps |
| Priority interview | Read `.brief/rules/INTERVIEW.md`, ask the questions |
| Log a decision | Append to `.brief/DECISIONS.md` |
| Assign work | Edit `.brief/PEOPLE.md` |
| Add urgent item | Prepend to `.brief/PRIORITIES.md` |
| Log agent action | Append to `.brief/LOG.md` |
| Track relationships | Edit `.brief/GRAPH.md` |
| Override priorities | Edit `.brief/OVERRIDES.md` |

## Daily Flow

**Weekly (human, 15 min):**
Review `.brief/rules/INTERVIEW.md` questions. Update product priorities.

**Morning (agent):**
```bash
brief check --health                 # current schema, legacy, missing, broken?
brief fetch                          # get fresh data
brief check --enrichment             # stale?
# If exit 5: read rules/BUILD.md + raw/ → write PRIORITIES.md
cat .brief/PRIORITIES.md             # context for the day
```

If `brief check --health` says `legacy-schema` or `misconfigured`, treat Brief as degraded context, not as a trusted steering layer.

**During work:**
Edit DECISIONS.md, PEOPLE.md, GRAPH.md, LOG.md as things happen.

**Evening (agent):**
Read `.brief/rules/EVENING.md`. Log what was done. Commit.

## Principles

1. **Convention first.** The `.brief/` directory IS the product.
2. **3 commands.** init, fetch, check. Everything else is files.
3. **Rules in markdown.** Agents read rules/ and follow them.
4. **Agent does the thinking.** CLI fetches data. Agent enriches.
5. **Health before trust.** A successful command run does not automatically mean the workspace matches the current Brief schema.
6. **Tool-agnostic.** Works with any tool that reads files.

## Spec

See [SPEC.md](./SPEC.md) for the full convention specification.

## License

MIT
