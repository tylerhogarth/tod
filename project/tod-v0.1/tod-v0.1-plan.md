# tod v0.1 Plan

## Assumptions

1. The repository is hosted on GitHub; CI is GitHub Actions running typecheck, Biome, and bun test on every PR.
2. Delivery is via stacked feature branches and PRs, one PR per milestone, merged in order by the maintainer.
3. The rendered instruction block targets a size budget of roughly 8 KB so it does not crowd agent context (NFR5); the exact figure is tunable.
4. Manual agent verification (the dogfood pass) uses Claude Code plus at least one native AGENTS.md agent (opencode or Codex CLI).
5. Publishing to npm requires the maintainer's npm account; the publish task is an operator action the plan flags as a dependency.
6. Automated tests run the CLI against a temporary fake home directory (`HOME` override) so no test touches the real `~/.agents/`, `~/.claude/`, or `~/.tod/`.

**Spec:** tod-v0.1-spec.md (same directory)

## Test Cases

Automated (bun test, run in CI):

1. **TC-1** (AC1): `tod init` in a fake home with pre-existing `~/.agents/AGENTS.md` and `~/.claude/CLAUDE.md` containing operator content creates `~/.tod/` (config, seed operator memory, empty work state, empty log) and appends tod's marker block to both files; pre-existing content is byte-identical; a second `tod init` is a no-op.
2. **TC-2** (AC1, FR7): the built package is named `tod-ai` and maps a `tod` binary; the packed tarball contains no personal data or machine paths.
3. **TC-3** (AC7): after hand-editing inside tod's marker block and deleting a `~/.tod/` structural file, `tod sync` restores both; operator memory, work state, log, and content outside the markers are byte-identical.
4. **TC-4** (NFR3): `tod sync` is idempotent; a second run changes nothing.
5. **TC-5** (AC9): `tod work` and `tod log` mutations persist correctly, are idempotent where re-run, and leave files untouched on failure; a malformed `work.json` makes commands stop, change nothing, and print a what/why/fix error.
6. **TC-6** (AC5, FR3): with seeded work state across multiple projects, `tod status` reports the projects, features, tasks, and statuses.
7. **TC-7** (AC10): CI runs typecheck, Biome, and bun test; all green on main.
8. **TC-8** (NFR5): the rendered instruction block stays under the size budget.
9. **TC-9** (FR10–FR22 content guard): the rendered block contains the required rule sections: do-not-edit markers, onboarding directive, operator-memory rules, communication rendering, persona composition, work and CLI usage rules, git workflow rules.
10. **TC-10** (NFR7): a write targeting a path outside the allowlist, including via an escaping symlink, is refused with an error naming the boundary.

Manual (dogfood pass in M5):

11. **TC-11** (AC2): first session after init; the agent runs onboarding unprompted and writes the profile to operator memory.
12. **TC-12** (AC3): a second AGENTS.md-reading agent adopts the harness with zero setup and consults work state when asked about work.
13. **TC-13** (AC4): a stated working preference is recorded in memory and honoured by a fresh session.
14. **TC-14** (AC5): a feature started conversationally is recorded via `tod work` and appears in `tod status` and a new session's answer.
15. **TC-15** (AC6): a requested change lands on a new branch, not main.
16. **TC-16** (AC8): with a non-technical profile, the agent supplies product and engineering judgement itself and communicates per the configured dimensions.

## Milestones

### Implement M1: Repository foundation and CLI skeleton

Status: ✓ Complete (CI green on PR #1)

_Outcomes_
The tod repo builds and tests green in CI. `tod --help` runs locally and routes to stub commands. Package metadata publishes as `tod-ai` with a `tod` binary.

Covers: FR7, NFR1, NFR6 (partial), NFR8, AC10.

**Tasks:**

1. [x] Initialise the Bun + TypeScript project: Biome config, bun test wiring, `package.json` for `tod-ai` with the `tod` bin entry and MIT metadata (satisfies: TC-2, TC-7)
2. [x] CLI entry point with command routing, `--help`/`--version`, and stub subcommands (satisfies: TC-7)
3. [x] GitHub Actions CI running typecheck, Biome, and bun test on PRs and main (satisfies: TC-7)
4. [x] README stub: what tod is, status badge, install placeholder
5. [x] Write boundary module: allowlisted roots, symlink-resolved containment check, unit tests (satisfies: TC-10 partially)
6. [x] Repo AGENTS.md with engineering rules and a CLAUDE.md symlink

### Implement M2: State foundations, init, and sync

Status: ☐ Not started

_Outcomes_
`tod init` installs the harness into a home directory: `~/.tod/` state plus marker blocks appended to both agent instruction files, preserving existing content byte-for-byte. `tod sync` re-renders and repairs idempotently. All writes are atomic and boundary-checked.

Covers: FR1, FR2, FR8, FR9, FR12 (mechanical half), NFR2, NFR3, NFR4, NFR7.

**Tasks:**

1. [ ] Atomic, boundary-checked file-write layer used by every mutation (satisfies: TC-10)
2. [ ] Marker-block engine: append or update tod's delimited block inside a possibly pre-existing file, preserving surrounding content byte-for-byte (satisfies: TC-1, TC-3)
3. [ ] Config schema and defaults (zod-validated) plus `~/.tod/` layout creation (satisfies: TC-1)
4. [ ] `tod init`: state dir, seed operator memory, empty work state and log, block install into detected agent files (satisfies: TC-1)
5. [ ] `tod sync`: re-render blocks, repair `~/.tod/` structure, never touch agent-writable state or content outside markers (satisfies: TC-3, TC-4)
6. [ ] End-to-end tests running the CLI against fake home directories (satisfies: TC-1, TC-3, TC-4, TC-10)

### Implement M3: Instruction block content — the operator harness

Status: ☐ Not started

_Outcomes_
The rendered block carries the operator harness: agent-led onboarding, operator-memory rules, communication dimensions, persona composition, work and CLI usage rules, and the git workflow. Content is asserted by tests and within the size budget.

Covers: FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR20, FR21, FR22 (instruction half), NFR5.

**Tasks:**

1. [ ] Block template: harness preamble, do-not-edit rule, operator-memory read/write rules (satisfies: TC-9)
2. [ ] Agent-led onboarding directive: first-session conversation, capability-gap discovery, profile written to memory (satisfies: TC-9, TC-11)
3. [ ] Communication configuration rendering from config, plus the inferred-preference rule (satisfies: TC-9, TC-13, TC-16)
4. [ ] Persona composition: gap-based virtual team rules with a single coherent interface (satisfies: TC-9, TC-16)
5. [ ] Git workflow rules: branch-per-feature, no direct work on main, builder-terms explanation, agent owns mechanics (satisfies: TC-9, TC-15)
6. [ ] Work orchestrator and CLI usage rules: record via `tod work`/`tod log`, answer from work state, never hand-edit tod-managed files (satisfies: TC-9, TC-14)
7. [ ] Size-budget and content-assertion tests over the rendered block (satisfies: TC-8, TC-9)

### Implement M4: Work orchestrator commands

Status: ☐ Not started

_Outcomes_
Agents record and update work deterministically: `tod work` and `tod log` mutate state atomically, `tod config` adjusts settings, and `tod status` reports work in flight across projects.

Covers: FR3, FR4, FR5, FR6, FR13 (mechanical half), FR17, FR18, FR19, FR22.

**Tasks:**

1. [ ] Work-state module: zod schema, load/save through the atomic write layer, malformed-state errors with fixes (satisfies: TC-5)
2. [ ] `tod work` subcommands: add, done, update across projects, features, and tasks (satisfies: TC-5, TC-6)
3. [ ] `tod log`: append-only timestamped entries (satisfies: TC-5)
4. [ ] `tod config`: get and set settings including communication dimensions (satisfies: TC-9 via sync rendering)
5. [ ] `tod status`: human-readable in-flight report across projects (satisfies: TC-6)

### Release M5: Docs, dogfood, publish, close-out

Status: ☐ Not started

_Outcomes_
A stranger can install `tod-ai` from npm and set up the harness from the README. The manual test cases pass against real agents. The project folder is closed out.

Covers: FR7, NFR6, AC1–AC10 verification.

## Shipping Strategy

Nothing is user-visible until the npm publish in M5; every Implement milestone merges to main safely because the package is unpublished. The publish itself is the release gate. No feature flags needed.

**Tasks:**

1. [ ] Full README: install, quick start, harness concepts, supported agents; CONTRIBUTING for the open-source posture
2. [ ] Dogfood pass: run TC-11 through TC-16 with Claude Code and one native AGENTS.md agent; fix what fails; record results (satisfies: TC-11, TC-12, TC-13, TC-14, TC-15, TC-16)
3. [ ] Publish `tod-ai` to npm (maintainer action: npm account required); verify a clean-machine install (satisfies: TC-2)
4. [ ] Close-out: verify every AC against its test cases, move durable docs into `docs/`, delete `project/tod-v0.1/`

## Open Questions

1. Deferred: the npm publish (M5 task 3) depends on the maintainer's npm account and 2FA; everything up to it is automatable.
2. Deferred: TC-11 through TC-16 need real agent sessions; automated simulation can smoke-test file plumbing but not agent behaviour. Results recorded during the M5 dogfood pass.

## Revision Log

2026-09-01: Ownership model changed from whole-file generation to delimited marker blocks inside possibly pre-existing shared files (spec FR1, FR7, FR8). Added operator-system write boundary, atomic non-destructive writes, deterministic mutation commands, and agent-facing CLI principles. M1 expanded with the boundary module and repo AGENTS.md at operator request; project scaffolded with Bun, TypeScript, Biome, better-result, zod.

2026-09-01: Redesigned to a user-global harness at operator direction. Integration moved from a workspace directory to the agent harness config folders (`~/.agents/AGENTS.md`, `~/.claude/CLAUDE.md`) with all state in `~/.tod/`. Project-specific commands and folders removed (`tod new`, per-project instruction files, workspace concept); projects now exist only as names in work state. Work state moved from markdown to CLI-mutated JSON with `tod status` as the human-readable view; added `tod work`, `tod log`, `tod config` commands. Spec and test cases rewritten; milestones M2–M4 re-scoped.
