# tod

An operator harness that turns any AGENTS.md-compatible coding agent into a software factory for non-technical builders.

You describe what you want built; your coding agent builds it. tod sits between you and that agent, making the agent behave like your product team: it learns who you are, communicates at your level, tracks work across your projects, and follows a safe git workflow so you never end up in a state you cannot recover from.

tod has opinions about process, but it never writes application code, never scaffolds projects, never touches your project folders, and never deploys. It guides the agent you already use.

## How it works

tod installs a delimited instruction block into your agent's own global instruction file, and keeps its state in `~/.tod/`:

```
~/.agents/AGENTS.md    # cross-agent standard (Codex, opencode, ...)
~/.claude/CLAUDE.md    # Claude Code
~/.tod/
  config.json          # settings, communication style
  operator.md          # what your agents know about you
  work.json            # projects, features, tasks
  log.jsonl            # append-only activity log
```

Everything outside tod's markers stays untouched, byte for byte. Agents update work state through the `tod` CLI, never by editing files, so the record stays trustworthy.

## Install

```sh
npm install -g tod-ai   # or: bun add -g tod-ai
tod init
```

`tod init` asks nothing. Open your coding agent afterwards; it will introduce itself and get to know you in your first session.

## Commands

The CLI is designed for agents to run, but it is safe to use yourself:

```sh
tod status   # what is in flight across all your projects
tod init     # set up the harness (idempotent)
tod sync     # repair tod-managed content after any damage
tod work     # record and update features, bugs, tasks (agent-facing)
tod log      # append to the activity log (agent-facing)
tod config   # read or change settings such as communication style
```

Every command is non-interactive and idempotent, refuses to write outside `~/.agents/`, `~/.claude/`, and `~/.tod/`, and reports exactly what it changed.

## Supported agents

Any agent that reads the global `~/.agents/AGENTS.md` works with zero configuration, including Codex CLI and opencode. Claude Code is supported through `~/.claude/CLAUDE.md`. Adding another agent is a one-line target in `src/paths.ts`.

## Development

```sh
bun install
bun run check   # typecheck + lint + tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT
