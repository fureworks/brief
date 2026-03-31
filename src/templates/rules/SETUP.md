# Brief Setup Guide

Follow these steps to connect Brief to your team's data sources. Ask the user each question and configure `brief.toml` accordingly.

## Step 1: Basic Info

Ask:
- What is your team/project name?
- Who is the team lead or priority owner?

Save as `maintainer` in brief.toml.

## Step 2: Code Repositories

Ask:
- What GitHub organization do you use?
- Which repos should Brief track? (list them)
- Is Scope CLI installed? (`which scope`)
- Is `gh` CLI authenticated? (`gh auth status`)

For each repo, add to brief.toml:
```toml
[[sources]]
name = "github-{repo}"
type = "command"
command = "gh pr list --repo {org}/{repo} --state open --json number,title,reviewDecision,mergeable,labels --limit 20"
target = "priorities"
priority = 40
timeout = 15
```

If Scope is installed:
```toml
[[sources]]
name = "scope"
type = "command"
command = "scope today --no-calendar --json"
target = "priorities"
priority = 50
timeout = 15
```

## Step 3: Knowledge Base

Ask:
- Where is your team's knowledge base or documentation?
- Which files contain product priorities, roadmap, or delivery tracking?

For each directory/file:
```toml
[[sources]]
name = "kb"
type = "directory"
path = "~/path/to/knowledge-base"
files = ["DELIVERY-TRACKER.md", "product-kpis.md"]
target = "priorities"
priority = 30
```

## Step 4: Meetings

Ask:
- Do you use a meeting tool with an API or MCP? (Nomo, Fireflies, etc.)
- If yes, what's the command to fetch pending action items?

```toml
[[sources]]
name = "meetings"
type = "command"
command = "{meeting tool command}"
target = "decisions"
priority = 60
timeout = 15
```

If no meeting tool: skip. Decisions will be logged manually.

## Step 5: Notifications (optional)

Ask:
- Do you want Telegram notifications for urgent items?
- If yes, what's your bot token and chat ID?

```toml
[notify]
enabled = true
telegram_bot_token = "{token}"
telegram_chat_id = "{chat_id}"
```

## Step 6: AI Tool Integration

Ask:
- What AI coding tools does your team use? (Claude Code, Codex, Cursor, etc.)

For each tool, output the integration snippet. For Claude Code:
```markdown
# Add to CLAUDE.md:
Before starting any task, run: brief check
If exit code is 1 or 2, read .brief/PRIORITIES.md for updated context.
```

## Step 7: First Interview

After setup, immediately run through `.brief/rules/INTERVIEW.md` to capture initial priorities. Save output to `.brief/PRIORITIES-HUMAN.md`.

## Step 8: First Fetch + Build

```bash
brief fetch
# Then follow .brief/rules/BUILD.md to create the first PRIORITIES.md
```

## Done

Brief is configured. The daily workflow:
1. `brief fetch` → pull fresh data
2. `brief check --enrichment` → rebuild if stale
3. Follow `rules/BUILD.md` to write PRIORITIES.md
4. Read PRIORITIES.md → work → log → commit
