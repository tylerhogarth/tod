# Contributing

Thanks for your interest in tod. Issues and pull requests are welcome.

## Ground rules

1. All changes go through a pull request, even from the maintainer. CI runs `bun run check:full` and must be green.
2. tod runs on the machines of non-technical users, so safety rules are non-negotiable: every filesystem write goes through the boundary allowlist, edits to shared files stay inside tod's marker block, writes are atomic, and failed commands change nothing. See `AGENTS.md` for the full engineering rules.
3. tod never writes application code, never scaffolds projects, never writes into project folders, and never deploys. Pull requests that add those will be declined.
4. The CLI's audience is coding agents. Help text says when to use a command; every error states what failed, why, and the exact next action.
5. Dependencies are added only when they materially improve type safety, correctness, security, or an agent's ability to validate its work. Reach for Bun and Node built-ins first.

## Working on tod

```sh
bun install
bun run check        # fast loop: typecheck, lint, tests
bun run check:full   # complete gate: adds the build and dead-code analysis
bun test tests/harness.test.ts   # a single test file
bun run build        # node-target bundle in dist/
```

The [contributor documentation](docs/README.md) explains the architecture, the core rules and where each is enforced, the instruction block and skill tod ships, and how to add a command, an agent target, or a skill.

Tests never touch your real home directory; they run the CLI against temporary fake homes. Keep it that way.

## Releasing

Releases are published to npm as `tod-ai` by the maintainer. Every release is tagged `v<version>`; the tag triggers the release workflow, and `tod skills` on that version installs the skill from that tag. `prepublishOnly` runs `check:full`.
