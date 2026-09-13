# tod v0.2 Plan

## Assumptions

1. Skills are distributed with the open skills tooling (`npx skills add`). Ref pinning via the `owner/repo#<ref>` fragment is verified working: a valid ref resolves, an invalid ref fails loudly rather than falling back to a default branch.
2. `skills/` is a well-known discovery path for that tooling, so the repository's skill layout and the local skill-authoring convention agree.
3. Every release is tagged `v<version>`. The repository currently has no tags, so `v0.2.0` is the first, and the existing tag-triggered release workflow runs for the first time.
4. The recommended stack is installed by the agent at current versions. The plan pins nothing and records no version numbers in the skill.
5. Local development databases use a local Prisma Postgres server. Managed cloud hosting is an operator opt-in and is not recommended by default.
6. tod's own repository adopts the applicable subset of the paved road and keeps its existing test runner, documented as an exception.

**Spec:** tod-v0.2-spec.md (same directory)

## Test Cases

Automated (bun test, run in CI):

1. **TC-1** (FR2, AC5): `tod skills` prints an install command containing the running version as a `v`-prefixed tag, exits 0, and performs no filesystem write.
2. **TC-2** (FR2, NFR1): `tod skills` run against a fake home leaves that home byte-identical.
3. **TC-3** (FR1): the repository contains `skills/tod-create-project/SKILL.md`, its frontmatter `name` matches the directory, and its `description` uses trigger-phrase form.
4. **TC-4** (FR6): the skill ships exactly one project instruction template, and the template contains the paved-road sections the skill claims it does.
5. **TC-5** (NFR4, NFR5): no file under the skill directory contains an absolute path, a home-directory reference, or an agent-specific tool name.
6. **TC-6** (FR7): the skill contains no version pins and no install commands for the recommended stack.
7. **TC-7** (FR4, NFR3): the global instruction block references the skills command, and the rendered block stays within the size budget.
8. **TC-8** (AC6, NFR1): the existing boundary tests pass unchanged; no new write path is introduced.
9. **TC-9** (FR16, AC7): the repository's own `check` and `check:full` scripts exist and pass, including Knip.
10. **TC-10** (FR16): the repository tsconfig enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.

Manual (maintainer verification):

11. **TC-11** (AC1): with tod installed from npm, an agent asked to build something new reaches the skill through `tod skills` and installs it at the matching tag.
12. **TC-12** (AC2): a project scaffolded through the skill has the project `AGENTS.md`, the `CLAUDE.md` symlink, strict TypeScript, and working `check` and `check:full`.
13. **TC-13** (AC3): unsafe TypeScript, a lint violation, and a failing test each fail `check`, and the agent fixes rather than reports.
14. **TC-14** (AC4): an off-road operator request is acknowledged once, followed, and recorded in the project `AGENTS.md`.
15. **TC-15** (FR10): a scaffolded project reaches a working local database without an account or a cloud sign-up.

## Milestones

### Implement M1: The skill and its template

Status: ✓ Complete (local checks green; skill discovery verified against the skills tooling)

_Outcomes_
The `tod-create-project` skill exists in the repository, carries the paved road, and ships one project instruction template. It is installable by the skills tooling and passes the content guards.

Covers: FR1, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, NFR2, NFR4, NFR5.

**Tasks:**

1. [x] Skill scaffold and frontmatter: `skills/tod-create-project/SKILL.md` with trigger-phrase description and a body an agent can act on alone (satisfies: TC-3)
2. [x] Skill body: the create-a-project workflow, from understanding the request through scaffolding, verification, and reporting to the operator (satisfies: TC-3)
3. [x] Project instruction template in the skill's assets, written as `AGENTS.md` with a `CLAUDE.md` symlink (satisfies: TC-4, TC-12)
4. [x] Stack reference: recommended tools, rationale, and the operator-override rule, with no pins and no install commands (satisfies: TC-6)
5. [x] Verification reference: the `check` and `check:full` split, the TypeScript and Biome invariants, the testing policy, the dependency preference order (satisfies: TC-6)
6. [x] Content guard tests over the skill directory: naming, frontmatter shape, no absolute paths, no pins, no agent-specific tool names (satisfies: TC-3, TC-4, TC-5, TC-6)

### Implement M2: Discovery from inside a session

Status: ✓ Complete (local checks green)

_Outcomes_
An agent in a tod session can find and install the skill at the tag matching its tod version, without constructing the tag itself.

Covers: FR2, FR3, FR4, NFR1, NFR3.

**Tasks:**

1. [x] `tod skills` command: prints the pinned install command for the running version, writes nothing, exits 0 (satisfies: TC-1, TC-2)
2. [x] Instruction-block pointer: a short section directing the agent to run `tod skills` when the operator starts something new (satisfies: TC-7)
3. [x] Tests: version-to-tag mapping, no-write guarantee, block content and size budget (satisfies: TC-1, TC-2, TC-7, TC-8)

### Implement M3: tod adopts its own paved road

Status: ✓ Complete (local checks green; the strict compiler flags were already in place)

_Outcomes_
The tod repository follows the applicable subset of the paved road, so the standard is dogfooded rather than only published.

Covers: FR16, FR17, AC7.

**Tasks:**

1. [x] Strict TypeScript flags: enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` and fix the resulting errors by correcting types, not by weakening configuration (satisfies: TC-10)
2. [x] Hardened Biome rules matching the ones the skill recommends (satisfies: TC-9)
3. [x] Split `check` into the fast loop and `check:full`, and wire both into CI (satisfies: TC-9)
4. [x] Add Knip, resolve its findings, and place it in `check:full` (satisfies: TC-9)
5. [x] Record the test-runner exception and its reason in the repository instruction file (satisfies: TC-9)

### Release M4: Docs, tag, verify

Status: ► In progress (docs done; tagging, the release run, and the verification pass remain with the maintainer)

_Outcomes_
A stranger can install tod, reach the skill, and scaffold a project on the paved road. The first release tag exists and the release workflow has run.

Covers: FR3, AC1 to AC7 verification.

**Tasks:**

1. [x] README: the paved road, how the skill is installed, and what the agent does with it
2. [x] Repository instruction file: replace the stale v0.1 project reference and record the paved-road adoption
3. [ ] Tag `v0.2.0` and exercise the release workflow for the first time; confirm the published version and the skill tag agree (satisfies: TC-11)
4. [ ] Manual verification pass: TC-11 through TC-15 against a real agent session
5. [ ] Close-out: verify every acceptance criterion against its test cases and delete `project/tod-v0.2/`

## Shipping Strategy

M1 and M2 are additive: a new skill directory and a new read-only command. Neither changes existing behaviour, so both merge safely ahead of any release. M3 touches the whole repository but is behaviour-preserving and gated by the existing test suite. The release gate is the `v0.2.0` tag in M4, which is the first moment an agent can install the skill at a pinned version.

## Open Questions

1. The recommended data layer is currently a release candidate upstream. The skill records no version, so this resolves itself on the upstream release; the manual verification pass in M4 should confirm a scaffolded project works against whatever is current at that time.
2. TC-11 through TC-15 need a real agent session and cannot be simulated. Results are recorded during the M4 verification pass.

## Revision Log

2026-09-08: Project opened. Scope set by the operator: recommend tooling only, never install or scaffold from the CLI, keep away from deployment targets, ship one skill with one template, distribute through the open skills tooling pinned to the release tag, and adopt the applicable subset of the paved road in tod's own repository while keeping its existing test runner.
