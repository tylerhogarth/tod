# Contributing

Thanks for your interest in tod. Issues and pull requests are welcome.

## Ground rules

1. All changes go through a pull request, even from the maintainer. CI (typecheck, Biome, tests) must be green.
2. tod runs on the machines of non-technical users, so safety rules are non-negotiable: every filesystem write goes through the boundary allowlist, edits to shared files stay inside tod's marker block, writes are atomic, and failed commands change nothing. See `AGENTS.md` for the full engineering rules.
3. tod never writes application code, never scaffolds projects, never writes into project folders, and never deploys. Pull requests that add those will be declined.
4. The CLI's audience is coding agents. Help text says when to use a command; every error states what failed, why, and the exact next action.
5. Dependencies are added only when they materially improve type safety, correctness, security, or an agent's ability to validate its work. Reach for Bun and Node built-ins first.

## Working on tod

```sh
bun install
bun run check       # typecheck + lint + tests
bun test tests/harness.test.ts   # a single test file
bun run build       # node-target bundle in dist/
```

Tests never touch your real home directory; they run the CLI against temporary fake homes. Keep it that way.

## Releasing

Releases are published to npm as `tod-ai` by the maintainer. `prepublishOnly` runs the full check suite and the build.
