# Brief

**Team working memory for AI agents and humans.**

Brief is a markdown convention plus a small CLI.
The markdown is the product. The CLI exists to help agents decide whether the workspace is trustworthy, fetch raw inputs, and migrate older workspaces forward.

## Quick Start

```bash
npm install -g @fureworks/brief
brief init --template startup
brief check --health
```

## What Brief Is

A `.brief/` directory that agents can read and update directly.

Current startup schema:

```text
.brief/
├── priorities.md
├── priorities-raw.md
├── decisions.md
├── decisions-raw.md
├── team.md
├── overrides.md
├── agent-log.md
├── PRIORITIES-HUMAN.md
├── .hash
├── .sources
├── state/
├── people/
├── raw/
└── rules/
    ├── BUILD.md
    ├── EVENING.md
    ├── FETCH.md
    ├── INTERVIEW.md
    ├── MORNING.md
    └── SETUP.md
```

## The CLI (4 commands)

```bash
brief init               # create .brief/ using the startup template
brief fetch              # fetch configured sources into .brief/raw/
brief check              # inspect health or detect priority/enrichment changes
brief migrate            # upgrade a legacy workspace toward current schema
```

That is intentionally small.
If the product ever starts growing a zoo of helper commands again, something went wrong.

## Trust First, Then Use

Before treating Brief as a steering layer, check health:

```bash
brief check --health
```

Possible states:
- `healthy-current-schema`
- `legacy-schema`
- `missing`
- `misconfigured`
- `stale`

### Meaning

- `healthy-current-schema`: safe to treat as current Brief
- `legacy-schema`: degraded context mode, not full modern Brief steering
- `missing`: no `.brief/` exists
- `misconfigured`: `.brief/` exists but required current-schema pieces are broken/missing
- `stale`: schema is current, but priorities need to be rebuilt from fresh inputs

**A command succeeding does not automatically mean the workspace is trustworthy.**
Health is the gate.

## The Intended Loop

```bash
brief check --health
brief fetch
brief check --enrichment
# if stale: read .brief/rules/BUILD.md + .brief/raw/ and update .brief/priorities.md
```

That is the actual workflow.
The agent reads the rules, reads the fetched raw inputs, and writes the markdown artifact.
The CLI does not do the thinking for you.

## Legacy Workspaces

If health says `legacy-schema`:
- Brief can still provide context
- but it should not be trusted as a full current steering layer
- the supported path forward is:

```bash
brief migrate --dry-run
brief migrate
```

Use `--dry-run` first.
Migration should show what it will create, what it will leave untouched, and what manual follow-up is still required.

## Convention Over Magic

Agents do not need special commands to:
- read priorities
- follow morning/evening rules
- log decisions
- update team context
- rewrite priorities from rules + raw inputs

They already know how to read and write files.
That is the point.

## Principles

1. **Convention first.** The markdown workspace is the product.
2. **Health before trust.** Schema honesty matters more than friendly output.
3. **CLI stays tiny.** Init, fetch, check, migrate.
4. **Agent does the thinking.** CLI fetches and verifies, markdown stores the result.
5. **Legacy is degraded mode.** Not fake compatibility.
6. **Migration beats ambiguity.** Old workspaces should be upgraded, not half-supported forever.

## Spec

See [SPEC.md](./SPEC.md) for the current product contract.

## License

MIT
