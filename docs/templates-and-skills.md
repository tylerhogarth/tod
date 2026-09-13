# Templates and skills

tod ships four kinds of text that an agent reads. Three are written by the CLI into the operator's home directory. The fourth is a skill the agent installs from this repository.

| Artefact | Source | Written where | Written by |
|---|---|---|---|
| Marker block | `src/template.ts` | Global instruction files | tod, on `init` and `sync` |
| Seed state files | `src/harness.ts` | `~/.tod/` | tod, on first `init` only |
| Onboarding script | `src/commands/init.ts` | Standard output | tod, on every `init` |
| `tod-create-project` skill | `skills/` | The agent's skills folder | The agent, via `npx skills add` |

## The marker block

The block is the body between `<!-- tod:begin ... -->` and `<!-- tod:end -->` in each agent's global instruction file. `renderBlock` in `src/template.ts` produces it from a `Config`. It is deterministic: the only variation is two lines and their headings, chosen by the `requirementGathering` and `responseDetail` settings on a 1 to 5 scale.

The block is an operating layer, not documentation. Its sections, in order:

1. Tod persona. The agent presents as Tod, a concise product engineer.
2. Session start. Ask whether the operator is building with Tod today; if yes, read `~/.tod/operator.md` first.
3. Precedence. Operator and project instructions win over the block.
4. The operator is non-technical. Make engineering calls; surface only decisions that change what the product does.
5. Requirement gathering and response detail. The two configured lines.
6. Reconfiguration. Offer `tod init` when the operator repeatedly works against a setting; never change config from inferred behaviour.
7. Starting something new. Run `tod skills` and install the skill before scaffolding anything.
8. Decide by risk. Build reversible work and show it; wait for a yes on anything hard to reverse.
9. Slice the work. One finishable slice at a time, each ending in something the operator can check.
10. Show your work. Evidence the operator can check without reading code.
11. Writing style. The house style for operator-facing prose.
12. Work tracking. Use `tod work`, `tod log`, and `tod status`; never edit files.
13. Git safety. A branch per feature and fix, explained without git vocabulary.
14. tod-managed files. What never to hand-edit, and that `operator.md` is the one exception.

Changing the block is the highest-leverage and highest-risk edit in the repository. Every operator's every session loads it. `tests/template.test.ts` guards its content by section, its size across every configuration, and its punctuation.

## Seed state files

`installHarness` writes these when missing and never again:

1. `config.json`. The two settings at their defaults of 3, with a schema version. Validated by zod on every read.
2. `operator.md`. A short header explaining that agents keep it current, and an empty preferences section. This is the only tod-managed file an agent edits directly.
3. `work.json`. An empty work state with `nextId` 1. Changed only through `tod work`.
4. `log.jsonl`. Empty. Changed only through `tod log`, one JSON object per line.

## The onboarding script

The CLI never prompts, so onboarding is agent-led. `tod init` prints a script after the install report. The agent delivers it to the operator as Tod, verbatim, as one message with both questions, waits for both answers, and records them:

```sh
tod config set requirement-gathering <1-5>
tod config set response-detail <1-5>
tod sync
```

The script is a constant in `src/commands/init.ts`, so every operator gets the same onboarding.

## The tod-create-project skill

The skill is the paved road: the engineering stack and verification standard an agent applies when scaffolding something new, or when bringing an existing project onto that standard. It lives in this repository rather than in the CLI because tod never writes into project folders. The skill instructs; the agent writes.

```
skills/tod-create-project/
  SKILL.md                              # frontmatter for routing, body the agent acts on
  references/stack.md                   # recommended tools, rationale, dependency preference order
  references/verification.md            # check and check:full, compiler and lint invariants, testing policy
  assets/project-agents.template.md     # the project AGENTS.md template
```

### Progressive disclosure

The frontmatter `description` is written in trigger-phrase form so an agent can route to the skill without opening it. The body is short enough to act on alone. The references are loaded on demand. Keep it that way: a skill body that grows into a manual stops being read.

### What the skill tells the agent to do

1. Halt if the request is ordinary feature work or a bug fix. Otherwise name the mode to the operator: new project, or refactor of an existing one onto the paved road. Refactor mode keeps existing behaviour and existing tooling choices, and merges rather than overwrites project instructions.
2. Establish what the thing does, whether it stores data, and whether it has a visual interface, within the harness's configured requirement-gathering level.
3. Choose layers. The core is always taken. The interface layer is added only for a visual interface. The data layer is added only when data must survive a restart.
4. Scaffold in an order where the agent's configuration wins: version control, then each tool's own initialiser, then the invariants last.
5. Copy the project template to `AGENTS.md`, fill every placeholder, and symlink `CLAUDE.md` to it.
6. Run the full verification on the empty scaffold and fix anything that fails.
7. Report to the operator in their terms, naming no tools unless asked.

### The paved road

| Layer | Tools |
|---|---|
| Core, every project | Bun, TypeScript, Zod, better-result, Vitest, Biome, Knip |
| Interface, visual projects only | React, Vite, React Testing Library, Playwright |
| Data, persistent data only | PostgreSQL, Prisma, with a local Prisma Postgres server for development |

The skill records no version numbers and no install commands. The agent works out current installation steps from each tool's own documentation. Managed cloud hosting is an operator opt-in. No deployment target is recommended.

### The project template

`assets/project-agents.template.md` becomes the scaffolded project's `AGENTS.md`. Its sections:

1. Name and one-line description, with a reminder that the operator is non-technical.
2. Commands, always including `bun run check` and `bun run check:full`.
3. Stack table for the layers actually taken, and a line naming the layers deliberately omitted.
4. How work gets done: verification as part of implementation, behaviour tests, boundary validation, typed results, the dependency preference order, a branch per change.
5. Invariants enforced by tooling. The file states that compiler and lint configuration hold the rules, and that weakening them is not a fix.
6. When to involve the operator, and when not to.
7. Operator decisions. Departures from the paved road with their reasons, so no later session re-argues them.

A trailing comment lists the placeholders and is deleted when the template is filled in. An unfilled placeholder is a defect.

### Guard tests

`tests/skills.test.ts` walks every file under the skill directory and rejects absolute paths, home-directory references, version numbers, and install commands for the recommended stack. It also checks that the frontmatter `name` matches the directory, that the description is in trigger-phrase form, that the template covers the paved road, and that exactly one template ships.

Agent-agnostic wording (no tool names specific to one harness) is a rule from the spec that the guard does not yet check. Review for it by hand.

## Distribution and pinning

Skills are installed from git, not from npm. `tod skills` prints:

```
npx skills add tylerhogarth/tod#v<version> --skill tod-create-project -g -y
```

The version is tod's own, read from `package.json`. The `#v<version>` fragment pins the install to the release tag, so an agent on tod 0.2.0 gets the skill exactly as it was at `v0.2.0`. Skill and CLI can therefore never disagree.

Consequences for contributors:

1. Every published release must carry a matching `v<version>` git tag, or the pinned install fails to resolve. The release workflow enforces that the tag matches `package.json`.
2. `tod skills` performs no network access, no installation, and no write. Printing is the whole feature. If the tag does not resolve, the skill tells the agent to report it rather than install from a branch.
3. The repository slug is parsed from the `repository.url` field in `package.json`. An unrecognisable URL is an error, not a guess.
