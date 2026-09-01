# tod v0.1 Plan

## Assumptions

1. The repository is hosted on GitHub; CI is GitHub Actions running typecheck, Biome, and bun test on every PR.
2. Delivery is via feature branches and PRs, one PR per milestone or coherent slice, even with a single maintainer.
3. The generated workspace AGENTS.md targets a size budget of roughly 10 KB so it does not crowd agent context (NFR5); the exact figure is tunable.
4. Manual agent verification (the dogfood pass) uses Claude Code plus at least one native AGENTS.md agent (opencode or Codex CLI).
5. Publishing to npm requires the maintainer's npm account; the publish task is an operator action the plan flags as a dependency.

**Spec:** tod-v0.1-spec.md (same directory)

## Test Cases

Automated (bun test, run in CI):

1. **TC-1** (AC1): `tod init` in a temp dir creates generated AGENTS.md with the generated marker, a CLAUDE.md symlink resolving to AGENTS.md, workspace config, a seed operator profile, and empty work state.
2. **TC-2** (AC1): the built package is named `tod-ai` and maps a `tod` binary; `npm pack` output contains the binary and no personal data.
3. **TC-3** (AC8): after deleting the CLAUDE.md symlink and hand-editing AGENTS.md, `tod sync` restores both; operator memory and work state are byte-identical before and after.
4. **TC-4** (NFR3): `tod sync` over a workspace with customised operator memory and work state leaves them untouched; a second `tod sync` is a no-op.
5. **TC-5** (AC3): `tod new` creates the project folder with generated instructions and adapter symlink, an initialised git repo with an initial commit on main, a work-state registration, and no application or tech-stack files.
6. **TC-6** (AC6): with seeded work-state fixtures across multiple projects, `tod status` reports the projects, features, tasks, and statuses.
7. **TC-7** (AC10): CI runs typecheck, Biome, and bun test; all green on main.
8. **TC-8** (NFR5): generated workspace AGENTS.md stays under the size budget.
9. **TC-9** (FR9–FR21 content guard): generated AGENTS.md contains the required rule sections: do-not-edit marker, onboarding directive, operator-memory rules, communication rendering, persona composition, work-state rules, git workflow rules, use-the-CLI rules.
16. **TC-16** (AC11): `tod init` over a pre-existing AGENTS.md appends tod's marker block and leaves the surrounding content byte-identical; a write targeting a path outside the allowlist is refused with an error naming the boundary.

Manual (dogfood pass, recorded in the M4 close-out):

10. **TC-10** (AC2): first session in a fresh workspace; the agent runs onboarding unprompted and writes the profile to operator memory.
11. **TC-11** (AC4): a second AGENTS.md-reading agent adopts the instructions with zero setup and consults work state when asked about work.
12. **TC-12** (AC5): a stated working preference is recorded in memory and honoured by a fresh session.
13. **TC-13** (AC6): a feature started conversationally appears in work state, `tod status`, and a new session's answer.
14. **TC-14** (AC7): a requested change lands on a new branch, not main.
15. **TC-15** (AC9): with a non-technical profile, the agent supplies product and engineering judgement itself and communicates per the configured dimensions.

## Milestones

### Implement M1: Repository foundation and CLI skeleton

Status: ► In progress (code complete; awaiting CI green on the PR)

_Outcomes_
The tod repo builds and tests green in CI. `tod --help` runs locally and routes to stub `init`, `new`, `sync`, and `status` commands. Package metadata publishes as `tod-ai` with a `tod` binary.

Covers: FR5, NFR1, NFR6 (partial), NFR8, AC10.

**Tasks:**

1. [x] Initialise the Bun + TypeScript project: Biome config, bun test wiring, `package.json` for `tod-ai` with the `tod` bin entry and MIT metadata (satisfies: TC-2, TC-7)
2. [x] CLI entry point with command routing, `--help`/`--version`, and stub subcommands for init, new, sync, status (satisfies: TC-7)
3. [x] GitHub Actions CI running typecheck, Biome, and bun test on PRs and main (satisfies: TC-7)
4. [x] README stub: what tod is, status badge, install placeholder
5. [x] Write boundary module: allowlisted roots, symlink-resolved containment check, unit tests (satisfies: TC-16 partially)
6. [x] Repo AGENTS.md with engineering rules and a CLAUDE.md symlink

### Implement M2: Workspace engine — init and sync

Status: ☐ Not started

_Outcomes_
`tod init` produces a working workspace: generated AGENTS.md (marker included), CLAUDE.md symlink, config, seed operator memory, empty work state. `tod sync` regenerates and repairs idempotently without touching agent-writable state.

Covers: FR1, FR3, FR6, FR7, FR8, FR11 (mechanical half), NFR2, NFR3, NFR4.

**Tasks:**

1. [ ] Generation engine: templates rendered from workspace config and operator profile, with machine-readable markers (satisfies: TC-1, TC-9)
2. [ ] Marker-block engine: append or update tod's delimited block inside pre-existing shared files, preserving surrounding content byte-for-byte; all writes atomic and boundary-checked (satisfies: TC-16)
3. [ ] `tod init`: workspace layout, config, seed operator memory, empty work state, workspace AGENTS.md (satisfies: TC-1)
4. [ ] Adapter layer with the Claude Code symlink adapter, structured so future adapters are additive; never replaces a pre-existing real file (satisfies: TC-1, TC-3)
5. [ ] `tod sync`: regenerate tod-managed content, repair symlinks, never touch operator memory, work state, or content outside tod's markers, idempotent (satisfies: TC-3, TC-4)
6. [ ] End-to-end tests running the CLI against temp directories (satisfies: TC-1, TC-3, TC-4, TC-16)

### Implement M3: Instruction content — the operator harness

Status: ☐ Not started

_Outcomes_
The generated AGENTS.md carries the operator harness: agent-led onboarding, operator-memory rules, communication dimensions, persona composition, work-state rules, and the git workflow. Content is asserted by tests and within the size budget.

Covers: FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR19, FR20, NFR5.

**Tasks:**

1. [ ] Workspace instruction template: harness preamble, do-not-edit rule, operator-memory read/write rules (satisfies: TC-9)
2. [ ] Agent-led onboarding directive: first-session conversation, capability-gap discovery, profile written to memory (satisfies: TC-9, TC-10)
3. [ ] Communication configuration: dimensions stored in config, rendered into instructions, inferred-preference rule for memory (satisfies: TC-9, TC-12, TC-15)
4. [ ] Persona composition: gap-based virtual team rules with a single coherent interface (satisfies: TC-9, TC-15)
5. [ ] Git workflow rules: branch-per-feature, no direct work on main, builder-terms explanation, agent owns mechanics (satisfies: TC-9, TC-14)
6. [ ] Size-budget and content-assertion tests over the generated output (satisfies: TC-8, TC-9)

### Implement M4: Projects and the work orchestrator

Status: ☐ Not started

_Outcomes_
`tod new` creates a registered, git-initialised project containing only instructions. Work state tracks projects, features, and tasks; `tod status` reports it; the instructions tell agents how to read and update it.

Covers: FR2, FR4, FR16, FR17, FR18.

**Tasks:**

1. [ ] Work-state format and read/write module: projects, features, tasks, statuses as human-readable markdown (satisfies: TC-6)
2. [ ] Project instruction template plus work-state rules in the workspace instructions (read, update, bulk operations) (satisfies: TC-9, TC-11, TC-13)
3. [ ] `tod new`: folder, project instructions and adapter, git init with initial commit on main, work-state registration, nothing else (satisfies: TC-5)
4. [ ] `tod status`: cross-project in-flight report from work state (satisfies: TC-6)

### Release M5: Docs, dogfood, publish, close-out

Status: ☐ Not started

_Outcomes_
A stranger can install `tod-ai` from npm and set up a workspace from the README. The manual test cases pass against real agents. The project folder is closed out.

Covers: FR5, NFR6, AC1–AC9 verification.

## Shipping Strategy

Nothing is user-visible until the npm publish in M5; every Implement milestone merges to main safely because the package is unpublished. The publish itself is the release gate. No feature flags needed.

**Tasks:**

1. [ ] Full README: install, quick start, workspace concepts, supported agents; CONTRIBUTING for the open-source posture
2. [ ] Dogfood pass: run TC-10 through TC-15 with Claude Code and one native AGENTS.md agent; fix what fails; record results (satisfies: TC-10, TC-11, TC-12, TC-13, TC-14, TC-15)
3. [ ] Publish `tod-ai` to npm (maintainer action: npm account required); verify a clean-machine install (satisfies: TC-2)
4. [ ] Close-out: verify every AC against its test cases, move durable docs into `docs/`, delete `project/tod-v0.1/`

## Open Questions

1. Deferred: the npm publish (M5 task 3) depends on the maintainer's npm account and 2FA; everything up to it is automatable.

## Revision Log

2026-09-01: Ownership model changed from whole-file generation to delimited marker blocks inside possibly pre-existing shared files (spec FR1, FR7, FR8). Added operator-system write boundary, atomic non-destructive writes, deterministic mutation commands, and agent-facing CLI principles (spec FR21, NFR3, NFR7, NFR8, AC11; plan TC-16). M1 expanded with the boundary module and repo AGENTS.md at operator request; project scaffolded with Bun, TypeScript, Biome, better-result, zod.
