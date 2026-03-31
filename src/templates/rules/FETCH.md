# Data Fetching Rules

Fetch these data points before building the brief. Save all output to `.brief/raw/`.

## Required

1. **Scope signals** (if scope CLI available):
   ```bash
   scope today --no-calendar --json > .brief/raw/scope.json
   ```

2. **GitHub PRs** (per repo in brief.toml):
   ```bash
   gh pr list --repo {repo} --state open --json number,title,reviewDecision,mergeable,labels > .brief/raw/github-prs-{repo}.json
   ```

3. **GitHub Issues** (assigned to me):
   ```bash
   gh issue list --assignee @me --state open --json number,title,labels,createdAt --limit 30 > .brief/raw/github-issues.json
   ```

## Optional

4. **Meeting action items** (if meeting tool MCP available):
   ```bash
   mcporter call meetingtool.list_action_items status=pending --output json > .brief/raw/meetings.json
   ```

5. **Knowledge base files** (listed in brief.toml [enrichment.context_files]):
   Copy or read each file. Save summaries to `.brief/raw/kb-context.md`.

## Custom

Add your own data sources here. Any command that produces JSON or text is valid.
Save output to `.brief/raw/<source-name>.json` or `.md`.

## After Fetching

Run `brief build` to combine fetched data into PRIORITIES.md.
