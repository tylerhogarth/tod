# tod

An operator harness CLI for coding agents, built with Bun and TypeScript. There is no human-facing UI: the CLI's users are coding agents acting for non-technical operators.

## Commands

- Install: `bun install`
- All checks (run before committing): `bun run check`
- Single test file: `bun test tests/boundary.test.ts`
- Fix lint and formatting: `bun run lint:fix`

## Entry points

- CLI entry and routing: `src/cli.ts`, `src/run.ts`
- Subcommands: `src/commands/`
- Filesystem write allowlist: `src/boundary.ts`
- Agent-facing error format and exit codes: `src/output.ts`
- Active spec and plan: `project/tod-v0.1/`

## Agent-facing CLI

- Write help text for coding agents: state when to use a command, not only what it does.
- Every error states what failed, why, and the exact next action, via `formatError` in `src/output.ts`. Never emit an error without a `fix:` line.
- Commands are non-interactive: flags only, no prompts. Exit codes: 0 success, 1 failure, 2 usage error.
- Mutating commands print what they changed, and say so explicitly when nothing changed.

## Operator-system safety (highest priority)

- tod runs on the machines of non-technical operators. Every filesystem write must pass `isWriteAllowed` in `src/boundary.ts`. Writes are confined to `~/.agents/`, `~/.claude/`, and `~/.tod/`. tod never writes into project folders.
- Never add a write path that bypasses `src/boundary.ts`. Extend the allowlist there and nowhere else.
- Containment is checked after symlink resolution; a symlink that escapes the allowlist is refused.
- Never delete or overwrite a file tod did not create. No recursive deletes outside tod-owned state.
- Spawn processes with argument arrays; never interpolate untrusted strings into a shell command. Never escalate privileges.
- Write atomically: temp file, then rename. A failed command leaves every file untouched.
- On unexpected state (missing marker, malformed file, out-of-boundary path): stop, change nothing, and report with a fix. Never guess.

## Non-destructive edits

- tod-owned state lives in `~/.tod/`. In shared files (the operator's global `~/.agents/AGENTS.md` or `~/.claude/CLAUDE.md`), tod owns only its delimited marker block: append the block if absent, rewrite only inside the markers, never touch surrounding content.
- Every mutation is idempotent: running the same command twice produces identical file state.

## Determinism first

- Routine mutations (appending a log line, updating a marker block, registering a project) are CLI commands with tests. Do not design features that ask an agent to hand-edit tod-managed files.
- When agent judgement is unavoidable (for example operator-memory prose), still route the write through a command.

## Dependencies

- Reach for Bun and Node built-ins first.
- Add a dependency only when it materially improves type safety, correctness, security, or an agent's ability to validate its work. `better-result` and `zod` are in on this basis.
- Pin exact versions. Reject packages with install scripts.

## Code style

- Return `Result` from `better-result` for fallible operations at module boundaries; do not throw across them.
- Validate external input (CLI args, file contents) with `zod` at the boundary. Never trust file contents.
- tod state files stay human-readable and diffable (markdown, JSON).
- tod's own stack never leaks into operator-facing instructions.

## Delivery

- All changes on feature branches via PRs; never commit to main.
- This repo is public: no operator data, no personal information, no machine-specific paths in code, docs, or commits.
