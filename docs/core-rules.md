# Core rules

tod runs on the machines of people who cannot inspect what it did. Every rule below exists so a command can never leave an operator worse off than before it ran. `AGENTS.md` states each rule as an instruction. This page gives the reason, the module that enforces it, and the test that proves it.

## 1. Writes are confined to three folders

tod writes only inside `~/.agents/`, `~/.claude/`, and `~/.tod/`. It never writes into a project folder.

Why. A non-technical operator cannot audit a tool that writes anywhere. Three named folders are a boundary they can be told about in one sentence, and it means a bug in tod can never damage their project.

Enforced by `isWriteAllowed` in `src/boundary.ts`, called from `writeFileAtomic` in `src/fsx.ts` and from the append path in `src/commands/log.ts`. Containment is checked after symlink resolution, so a symlink that escapes the allowlist is refused.

Tested in `tests/boundary.test.ts` and by the no-write assertions in `tests/skills.test.ts`.

How to keep it. Extend the allowlist in `src/boundary.ts` and nowhere else. Never add a write that bypasses `writeFileAtomic`.

## 2. Writes are atomic and failures change nothing

A write is a temp file followed by a rename. A failed command leaves every file as it was.

Why. A half-written `work.json` is unreadable, and the operator has no way to repair it. A half-written instruction file breaks every future agent session.

Enforced by `writeFileAtomic` in `src/fsx.ts` and by the two-phase shape of `installHarness` in `src/harness.ts`: all validation happens before the first write.

Tested in `tests/harness.test.ts`, which asserts that a malformed marker file leaves the whole home directory untouched.

## 3. tod owns only its marker block in shared files

The global instruction files belong to the operator. tod appends its block if absent, rewrites only between the markers if present, and never touches the surrounding content. Unbalanced or duplicated markers are an error, not something to repair by guessing.

Why. Operators and their agents put their own rules in those files. Losing them would be data loss the operator might not notice for weeks.

Enforced by `upsertBlock` in `src/markers.ts`, a pure function with no filesystem access, so it is fully unit-testable.

Tested in `tests/markers.test.ts` and `tests/harness.test.ts`.

## 4. Every mutation is idempotent

Running the same command twice produces identical file state, and the second run reports `unchanged`.

Why. Agents retry. Operators re-run `tod init` when something looks wrong. Neither should ever produce a second block or a duplicated log entry.

Enforced by content comparison in `writeFileAtomic` and by `upsertBlock` replacing rather than appending when a block exists.

Tested throughout `tests/harness.test.ts` and `tests/orchestrator.test.ts`.

## 5. Never delete or overwrite a file tod did not create

Seed files are written only when missing. `operator.md`, `work.json`, and `log.jsonl` become operator data the moment they exist. There are no recursive deletes anywhere in tod.

Enforced by the seed logic in `installHarness`, which reports an existing seed as `unchanged` without writing.

## 6. On unexpected state, stop and report with a fix

A missing marker, a malformed file, or an out-of-boundary path is an error. tod changes nothing and prints what failed, why, and the exact next action.

Why. The reader of the error is an agent acting for someone who cannot help it. Every error must be actionable without a human.

Enforced by `formatError` in `src/output.ts`, which requires a `fix` line by type, and by `harnessErrorToAgentError` in `src/commands/harness-io.ts`, which maps every tagged error to one.

Tested in `tests/cli.test.ts` and the error cases in `tests/harness.test.ts`.

## 7. Commands are non-interactive

No prompts. Everything is a flag or positional argument. Exit codes are 0 for success, 1 for a failure with a fix line, and 2 for a usage error.

Why. The caller is an agent. Onboarding questions are printed as a script for the agent to deliver, and the answers come back through `tod config set`.

Enforced by convention in `src/commands/` and checked by `tests/cli.test.ts`.

## 8. Processes are spawned with argument arrays

tod never interpolates an untrusted string into a shell command and never escalates privileges. Today tod spawns nothing at runtime. Tests spawn the CLI with `Bun.spawnSync` and an array.

## 9. External input is validated at the boundary

CLI arguments and file contents are validated with zod before use. File contents are never trusted, even files tod wrote.

Enforced by the schemas in `src/config.ts` and `src/work.ts`. A file that fails validation produces a `Config` or `WorkState` error with the zod message and a fix.

## 10. Fallible operations return Result

Modules return `Result` from `better-result` at their boundaries and do not throw across them. Errors are tagged classes so commands can match on `_tag` exhaustively.

Why. The compiler then tells you when an error path is unhandled, which matters more in a tool where every unhandled path is an operator-facing failure.

## 11. Routine mutations are commands, not instructions

If an agent needs to change tod-managed state, there is a command for it with tests. The block never asks an agent to hand-edit `work.json`, `log.jsonl`, or `config.json`. The one exception is `operator.md`, which is prose the agent writes directly.

Why. An instruction is followed unevenly. A command is deterministic and tested.

## 12. tod recommends, the agent writes

Anything that must happen inside a project is published as a skill under `skills/`. The skill instructs; the agent does the writing. Skills carry no version pins and no install commands, because those go stale on every upstream release and the agent can determine current steps itself.

Enforced by the content guard tests in `tests/skills.test.ts`, which reject absolute paths, version numbers, and install commands anywhere in the skill directory.

## 13. The block stays within its size budget

The marker block is loaded into every agent session. Each addition costs context on every turn for every operator.

Enforced by the size test in `tests/template.test.ts`, which renders every configuration combination and asserts each is under the budget. Push detail into CLI help text, `~/.tod/` files, or a skill, all of which are loaded on demand.

## 14. The repository is public

No operator data, no personal information, and no machine-specific paths in code, docs, or commits. Tests build fake homes in temporary directories and never read the real one.

## 15. Tooling enforces invariants, prose does not

`strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are on. Biome rejects explicit `any`, non-null assertions, and `ts-ignore`. Knip runs in `check:full` and its findings are resolved, not suppressed. Weakening any of this to silence an error is not an acceptable fix.

Why. This is the standard tod publishes to scaffolded projects through its skill. tod follows it so the standard is tested on a real codebase, with one documented exception: tod keeps `bun test` rather than the recommended runner, because it is a Bun CLI and a migration would be churn for no gain.

Tested in `tests/package.test.ts`, which checks the compiler flags and the shape of the `check` and `check:full` scripts.
