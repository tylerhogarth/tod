# tod

An operator harness that turns any AGENTS.md-compatible coding agent into a software factory for non-technical builders.

tod installs an operator harness at the user level: an instruction block inside your agent's own global instruction file (`~/.agents/AGENTS.md`, `~/.claude/CLAUDE.md`), plus operator memory, work state, and an activity log in `~/.tod/`. It has opinions about process (branching, work tracking, how the agent treats you) but never writes application code, never scaffolds projects, never touches your project folders, and never deploys. It guides the agent you already use: Codex, Claude Code, opencode, or anything else that reads AGENTS.md.

> Status: pre-release. The CLI skeleton is in place; harness installation and work-state reporting are under active development.

## Install

Not yet published. Once released:

```sh
bun add -g tod-ai   # or: npm install -g tod-ai
```

## Development

```sh
bun install
bun run check   # typecheck + lint + tests
```

## Licence

MIT
