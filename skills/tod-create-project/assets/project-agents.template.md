# {{PROJECT_NAME}}

{{ONE_LINE_DESCRIPTION}}

Built for a non-technical operator. Explain decisions in terms of what they change for the people using this software. Keep tool names, file paths, and internal mechanics out of replies unless asked.

## Commands

| Command | Use |
|---|---|
| `bun install` | Install dependencies |
| `bun run check` | Fast loop: types, static analysis, unit tests. Run constantly. |
| `bun run check:full` | Complete gate: adds production build, end-to-end tests, dead-code analysis. Run before declaring anything done. |
| `bun run dev` | Run the app locally |
{{ADDITIONAL_COMMANDS}}

## Stack

{{STACK_TABLE}}

Layers this project deliberately does not have: {{OMITTED_LAYERS}}

## How work gets done here

1. Implementation is not complete until `bun run check:full` passes. Verification is part of the work, not a follow-up.
2. New application logic carries tests that assert behaviour, not implementation detail. A test that breaks on every refactor is testing the wrong thing.
3. Validate untrusted input at the boundary where it enters: user input, requests, external data, environment configuration. Do not re-validate inside already-trusted internal code.
4. Use typed results for expected failure modes. Reserve exceptions for genuinely exceptional conditions.
5. Prefer what already exists. Work down: application primitives, standard language capabilities, runtime built-ins, framework primitives, dependencies already present, a new dependency, a bespoke implementation. Take a new dependency when it materially improves correctness, type safety, validation, security, reliability, or verification.
6. Every feature and every fix goes on its own branch. Never develop directly on the main branch.

## Invariants enforced by tooling, not by this file

Compiler and static-analysis configuration reject unsafe patterns, so this file does not restate them. If a check fails, fix the underlying cause. Never weaken configuration to make an error disappear, and never disable or delete a check to get a green result. If a check is genuinely wrong, say so and explain why before changing it.

## When to involve the operator

1. Before anything hard to reverse: deleting data, changing existing behaviour, or anything touching money, accounts, or privacy.
2. When a decision changes what the product does for its users.
3. When they ask for something that departs materially from the defaults above. Say so once, state the consequence, follow their decision, and record it below.

Do not involve them in tool choices, configuration, or implementation approach. Those are yours.

## Operator decisions

Departures from the default engineering approach, with the reason. Add to this list; do not re-argue anything already on it.

{{OPERATOR_DECISIONS}}

<!--
Template notes, delete this comment when filling the template in:
- Replace every {{PLACEHOLDER}}. An unfilled placeholder left in the file is a defect.
- ADDITIONAL_COMMANDS: one table row per extra command, or delete the line.
- STACK_TABLE: concern and choice, one row each, for the layers this project actually took.
- OMITTED_LAYERS: name what was left out and why, or write "none".
- OPERATOR_DECISIONS: write "None yet." when the project starts.
- Create CLAUDE.md as a symbolic link to this file so every agent reads the same instructions.
-->
