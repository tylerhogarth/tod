# Extending tod

Common changes, the files they touch, and the tests that must move with them.

## Development loop

```sh
bun install
bun run check          # fast loop: typecheck, Biome, tests
bun run check:full     # complete gate: adds the node build and Knip
bun test tests/harness.test.ts
bun run lint:fix
bun run sandbox init   # exercise the CLI against a gitignored fake home in output/
```

CI runs `check:full`. Knip reports unused exports and dependencies; resolve them rather than suppressing them, and export nothing that only one module uses.

## Test conventions

1. Tests spawn the CLI with `Bun.spawnSync` and an argument array, against a fresh temporary directory passed as `HOME` or `TOD_HOME`. No test reads or writes the real home directory.
2. Pure modules (`markers`, `work`, `config`, `template`, `boundary`) are tested directly. Commands are tested end to end through the CLI, asserting on exit code, stdout, stderr, and resulting file content.
3. A mutating command gets a second-run test asserting `unchanged` output and identical files.
4. An error path gets a test asserting the `fix:` line is present.

## Adding a command

1. Create `src/commands/<name>.ts` exporting a `Command`: a `help` string and an async `execute(args)` that returns an exit code from `EXIT`.
2. Write the help text for an agent. Say when to use the command, not only what it does.
3. Resolve paths from `resolveHome` and `todPaths`. Take the allowlist from `defaultAllowedRoots`. Write only through `writeFileAtomic`.
4. Every failure goes through `formatError` with a `what`, `why`, and `fix`. Usage errors return `EXIT.usage`; everything else returns `EXIT.failure`.
5. Print what changed. Say explicitly when nothing changed.
6. Register it in `src/commands/index.ts`, add it to the command list in `src/run.ts` help and the unknown-command fix line, and add it to the command list test in `tests/cli.test.ts`.
7. Add a test file. Cover the happy path, the idempotent second run, and each error.

If the command needs a new file under `~/.tod/`, add the path to `TodPaths` in `src/paths.ts`, a zod schema for its contents, and a seed in `installHarness` if it should exist after `init`.

## Supporting another agent

Integration is one marker block per agent's global instruction file. Add an entry to `agentTargets` in `src/paths.ts` with a display name, the config folder whose presence means the agent is installed, and the instruction file to append to.

If the instruction file lives outside the three allowed roots, extend `defaultAllowedRoots` in `src/boundary.ts`. That is the only place the allowlist changes, and it needs a boundary test and a line in the README's list of folders tod writes to.

Update the `skippedAgents.length === 2` check in `src/commands/init.ts`, which decides the summary line when no agent was found.

## Changing the marker block

Edit `renderBlock` in `src/template.ts`. Before you do:

1. Ask whether the content belongs in CLI help, a `~/.tod/` file, or a skill instead. The block is loaded on every turn for every operator.
2. Keep it deterministic. The only inputs are the two settings.
3. Follow the writing rules the block itself states: no em or en dashes, plain verbs, one idea per sentence.

Then update `tests/template.test.ts`. It asserts on section content, checks every configuration against the size budget, and rejects dashes. A block change that does not touch that test file is probably incomplete.

Every operator picks the change up on their next `tod sync`. There is no migration; the block is rendered whole each time.

## Changing a state file schema

`config.json` carries a `version` literal. Bumping the schema means bumping the literal, and a file at the old version then fails validation with a fix line telling the agent to repair or delete it. There is no automatic migration. If a migration is needed, it is a read-phase transform in the loader with its own tests, and it must still write through `writeFileAtomic`.

`work.json` follows the same pattern with its own `version` literal.

## Adding or changing a skill

1. Create `skills/<name>/SKILL.md` with frontmatter whose `name` matches the directory and whose `description` is in trigger-phrase form.
2. Keep the body short enough to act on alone. Put detail in `references/` and templates in `assets/`.
3. Carry no version pins, no install commands, no absolute paths, and no agent-specific tool names. The guard tests in `tests/skills.test.ts` reject the first three across every file in the directory; review the fourth by hand.
4. Add the skill to the `SKILLS` list in `src/commands/skills.ts` so `tod skills` prints its install command.
5. If the block should route agents to the skill, add a pointer to `renderBlock` and update the template tests.

The skill is only installable at a release tag, so a skill change reaches operators on the next release, not on merge.

## Releasing

1. Bump `version` in `package.json` on a branch and merge it.
2. Tag the merge commit `v<version>` and push the tag. The release workflow checks the tag against `package.json`, runs `check:full` through `prepublishOnly`, and publishes `tod-ai` to npm with trusted publishing.
3. Confirm `npx skills add tylerhogarth/tod#v<version> --skill tod-create-project` resolves, because `tod skills` on the published version prints exactly that.

A release without its tag breaks `tod skills` for every operator on that version.
