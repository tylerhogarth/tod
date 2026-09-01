# tod

An operator harness that turns any AGENTS.md-compatible coding agent into a software factory for non-technical builders.

tod owns the agent instructions, an operator memory, and cross-project work state, all as plain files your coding agent reads. It has opinions about process (branching, work tracking, how the agent treats you) but never writes application code, never scaffolds projects, and never deploys. It guides the agent you already use: Codex, Claude Code, opencode, or anything else that reads AGENTS.md.

> Status: pre-release. The CLI skeleton is in place; workspace initialisation, project registration, and work-state reporting are under active development.

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
