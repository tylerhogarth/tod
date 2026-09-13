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
  hints.json           # which hint to show next
```

Everything outside tod's markers stays untouched, byte for byte. Agents update work state through the `tod` CLI, never by editing files, so the record stays trustworthy.

## Install

```sh
npm install -g tod-ai   # or: bun add -g tod-ai
tod init
```

`tod init` asks nothing. Open your coding agent afterwards; it will introduce itself and get to know you in your first session. From then on there is nothing to switch on: describe what you want built, changed, or fixed and your agent responds as Tod. Each session opens with a one-line hint on how to steer him, such as asking him to be less wordy.

## Commands

The CLI is designed for agents to run, but it is safe to use yourself:

```sh
tod status   # what is in flight across all your projects
tod init     # set up the harness (idempotent)
tod sync     # repair tod-managed content after any damage
tod work     # record and update features, bugs, tasks (agent-facing)
tod log      # append to the activity log (agent-facing)
tod config   # read or change settings such as communication style
tod skills   # report tod's agent skills and how to install any missing (agent-facing)
tod hint     # print the next one-line hint on steering Tod (agent-facing)
```

Every command is non-interactive and idempotent, refuses to write outside `~/.agents/`, `~/.claude/`, and `~/.tod/`, and reports exactly what it changed.

## The paved road

tod has opinions about how software gets built, not just about process. Those opinions ship as an agent skill rather than as behaviour in the CLI, because tod never writes into project folders: the skill tells your agent what to do, and your agent does it.

`tod init` reports whether the skill is installed and prints the command that installs it, pinned to the release tag matching your installed tod. Your agent runs that command; skill and CLI therefore never disagree.

When you ask for something new, the agent scaffolds it on a known-good stack (Bun, TypeScript, React with Vite, PostgreSQL with Prisma, Zod, Vitest, Playwright, Biome), gives the project two verification commands, and configures the compiler and linter so unsafe code fails a check rather than relying on the agent to remember a rule.

These are defaults, not constraints. Ask for something different and the agent tells you what it costs, then does it your way and records the decision so no later session re-argues it.

## Supported agents

Any agent that reads the global `~/.agents/AGENTS.md` works with zero configuration, including Codex CLI and opencode. Claude Code is supported through `~/.claude/CLAUDE.md`. Adding another agent is a one-line target in `src/paths.ts`.

## Development

```sh
bun install
bun run check        # fast loop: typecheck, lint, tests
bun run check:full   # complete gate: adds build and dead-code analysis
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [contributor documentation](docs/README.md) for how tod works, its core rules, and the templates and skills it ships.

## Licence

MIT
